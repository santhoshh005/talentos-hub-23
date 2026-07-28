# Resume Analyzer v3 — Hybrid Rebuild

The current deterministic engines can't reach recruiter-grade accuracy across every domain. Regex tokenizers and hand-tuned alias tables will always miss context ("Sales Cloud" vs "Salesforce Sales Cloud consultant"), lose seniority nuance, and mis-identify companies/domains. The fix is to move **understanding** to an LLM (which is genuinely domain-agnostic) and keep **scoring** deterministic (so results are explainable, reproducible, and cheap to render).

## Recommended stack

**Best coding platform for this = what you already have.** TanStack Start on Lovable Cloud is the right home:

- **AI SDK (`ai` + `@ai-sdk/openai-compatible`)** via the **Lovable AI Gateway** — one key, structured output, streaming, tool-calling. No provider lock-in.
- **Model**: `google/gemini-3.6-flash` for extraction (fast, cheap, huge context, strong JSON adherence). Upgrade path to `google/gemini-3.1-pro-preview` for hard resumes if needed.
- **`createServerFn`** stays the orchestration surface — same pipeline shape as today.
- **Zod** for strict JSON schemas.
- **Deterministic scoring/evidence/PDF** stays in TS. Not moving those.

No new frameworks. No Python. No external vector DB. Everything runs on the existing Cloudflare Worker runtime.

## What we keep vs rebuild

| Layer | Today | v3 |
|---|---|---|
| Resume parsing (regex + AI hybrid) | brittle | **Rebuild** — pure LLM extraction to strict schema |
| JD intelligence | partly working | **Rebuild** — same LLM pass, same schema shape |
| Skill normalization (alias table) | small, IT-only | **Replace** — LLM emits canonical + aliases + category per skill |
| Matching engine | string + adjacency map | **Rebuild** — semantic match (LLM judges each JD requirement against the full resume skill set, returns match/partial/miss + reason) |
| Evidence engine | works, 9/10 | **Keep** — feed it normalized skills from new parser |
| Scoring engine (70/30) | works | **Keep** — plug new matcher output in |
| Recruiter intelligence (domain/seniority/summary) | weak inference | **Rebuild** — domain, seniority, strengths, risks, summary all come from the extraction LLM call |
| Pipeline orchestrator | good | **Keep** — swap stage implementations, timings stay |
| Recruiter report UI + PDF | good | **Keep** — pure renderers, inherit new data |

## New architecture

```text
                ┌─────────────────────────────────────────┐
Resume text ───►│  extractResume (LLM, strict JSON)       │──► ParsedResume v3
                └─────────────────────────────────────────┘   (identity, current
                                                              company/title, years,
                                                              skills[{canonical,
                                                              aliases[], category,
                                                              years, evidence[]}],
                                                              certifications, domain
                                                              hint, seniority hint)

                ┌─────────────────────────────────────────┐
JD text ───────►│  extractJD (LLM, strict JSON)           │──► ParsedJD v3
                └─────────────────────────────────────────┘   (title, seniority,
                                                              domain, required[],
                                                              preferred[], each
                                                              with canonical +
                                                              category + weight)

ParsedResume + ParsedJD
        │
        ▼
┌───────────────────────────────────┐
│ semanticMatch (LLM, strict JSON)  │──► per JD skill:
│  "For each required skill, does   │     { status: exact|equivalent|related|missing,
│   the candidate have it, and      │       matchedResumeSkill, confidence 0-100,
│   why?" — sees BOTH full lists    │       reason }
└───────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ Evidence engine (deterministic)   │  unchanged
│ Scoring engine   (deterministic)  │  unchanged (70/30)
│ Recruiter report / PDF            │  unchanged
└───────────────────────────────────┘
```

**Why this actually solves the accuracy problems:**

- Multi-word skills, aliases, ontology → the LLM emits `{canonical: "Sales Cloud", aliases: ["SFDC Sales Cloud"], category: "Salesforce"}` directly. No tokenizer, no adjacency map.
- Company/designation extraction → LLM reads the whole resume in context; no `at|@|Technologies` regex.
- Domain inference → LLM sees title + skills + experience together and returns a domain label.
- Seniority coherence → single LLM decision using years + titles + scope. One value, used everywhere.
- Cross-labeled skills (Kotlin ↔ Android, LWC ↔ Salesforce Platform) → the semantic-match LLM understands the relationship natively, with a reason string we surface in the UI.
- Domain-agnostic by construction — same prompt works for Salesforce, SAP, TA, Finance, Healthcare, Mechanical.

## Determinism guardrails

LLMs drift, so we constrain them:

- Strict Zod schemas via `Output.object`, provider built with `structuredOutputs: true` for OpenAI models; Gemini uses default schema mode.
- Temperature 0 for extraction and matching.
- Post-parse validation clamps confidence 0–100, dedupes skills by canonical (case-insensitive), drops empty strings.
- `NoObjectGeneratedError` fallback: retry once, then downgrade the affected stage to a minimal deterministic parse so the pipeline never crashes the report.
- Every LLM output is echoed into the existing Pipeline Transparency panel with token count + duration → recruiter can audit what the model said.

## Files

**New**
- `src/lib/llm-extract.server.ts` — `extractResume`, `extractJD` (strict Zod schemas, Gemini call, retry+fallback).
- `src/lib/semantic-match.server.ts` — `semanticMatch` (JD × resume → per-requirement verdict).
- `src/lib/intelligence-schemas.ts` — shared Zod types (`ParsedResumeV3`, `ParsedJDV3`, `SemanticMatchV3`).

**Rewritten (same exports, new internals)**
- `src/lib/resume-analyzer.server.ts` → thin wrapper around `extractResume`.
- `src/lib/jd-intelligence.server.ts` → thin wrapper around `extractJD`.
- `src/lib/skill-normalizer.ts` → deleted; normalization now lives in the LLM output. Pipeline stage becomes a no-op adapter that maps v3 skills to the shape evidence/scoring expects.
- `src/lib/matching-engine.ts` → replaced by adapter over `semanticMatch` output; keeps `MatchingResult` type so scoring/evidence/UI don't move.
- `src/lib/recruiter-intelligence.ts` → domain/seniority/strengths/risks/summary read directly from extraction output; `inferDomain`/`inferSeniority` deleted.

**Untouched**
- `evidence-engine.ts`, `scoring-engine.ts`, `pipeline.server.ts` (only the stage bodies change), `RecruiterReport.tsx`, `recruiter-report-pdf.ts`, `report-store.ts`, `AiLabWorkspace.tsx`, `ResumeAnalyzerModal.tsx`.

## Cost & latency

Per analysis: 3 LLM calls (resume extract, JD extract, semantic match). Gemini 3.6 Flash on typical resume+JD ≈ 4–8k input tokens, ~2k output tokens per call, ~2–5s total. Fully within Lovable AI Gateway credits — no new billing setup.

## Verification (before shipping)

Run the four-domain matrix from the previous sprint's plan:
1. **Salesforce** (Priya Reddy, Accenture) → domain `Salesforce CRM`, company `Accenture`, seniority `Senior`, `Sales Cloud`/`LWC` unified, score 85–92%.
2. **Data Engineer** (Spark/Airflow/dbt) → domain `Data Engineering`, score matches skill overlap.
3. **Talent Acquisition** (Naukri/Boolean/Greenhouse) → domain `Talent Acquisition`, no IT bleed-through.
4. **Financial Analyst** (SAP FICO/Modeling/GAAP) → domain `Finance`, seniority from years, no "Not Found".

Each must show: correct domain, correct company, correct seniority, multi-word skills unified, per-skill match reason visible in transparency panel, realistic score band, real pipeline timings.

## Non-goals

- No vector DB, no embeddings, no RAG.
- No new UI or PDF work — pure renderers inherit the improvements.
- No changes to Home/Dashboard/Timeline/Content/Certifications/Contact.
- No mock data — real LLM calls only.
