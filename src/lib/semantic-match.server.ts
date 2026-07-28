// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — Semantic Matcher
// ---------------------------------------------------------------------------
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  SemanticMatchV3Schema,
  type ParsedJDV3,
  type ParsedResumeV3,
  type SemanticMatchEntry,
  type SemanticMatchV3,
} from "./intelligence-schemas";

const MODEL = "google/gemini-3.6-flash";

const SYSTEM = [
  "You are TalentOS Semantic Matcher v3.",
  "You compare a candidate's skill inventory against a JD's required skills.",
  "For EACH JD requirement decide one of: exact, equivalent, related, missing.",
  "  exact      -> the candidate lists the identical canonical skill.",
  "  equivalent -> different name, same thing (e.g. LWC vs Lightning Web Components).",
  "  related    -> adjacent tech in the same family (e.g. Kotlin for Android, Sales Cloud for Salesforce Platform).",
  "  missing    -> no plausible signal in the resume.",
  "Return ONLY raw JSON. No prose. Never invent skills the candidate does not list.",
].join(" ");

function buildPrompt(resume: ParsedResumeV3, jd: ParsedJDV3): string {
  const resumeSkills = resume.skills.map((s) => ({ canonical: s.canonical, aliases: s.aliases, category: s.category }));
  const jdRequirements = [...jd.required, ...jd.preferred].map((r) => ({ canonical: r.canonical, aliases: r.aliases, category: r.category }));
  return `Return ONE JSON object with EXACTLY this shape:

{
  "matches": [
    {
      "requirement": string,
      "status": "exact" | "equivalent" | "related" | "missing",
      "matchedResumeSkill": string,
      "confidence": number,
      "reason": string
    }
  ]
}

RULES:
1. Produce ONE entry for EVERY JD requirement — never skip.
2. Confidence bands: exact=100, equivalent=95, related=80, missing=0.
3. "matchedResumeSkill" MUST come from CANDIDATE_SKILLS (canonical or alias). Empty when status is "missing".
4. Never invent a candidate skill. If unsure, mark missing.
5. Return ONLY the JSON object.

CANDIDATE_SKILLS:
${JSON.stringify(resumeSkills)}

JD_REQUIREMENTS:
${JSON.stringify(jdRequirements)}`;
}

export async function runSemanticMatch(resume: ParsedResumeV3, jd: ParsedJDV3): Promise<SemanticMatchV3> {
  const jdRequirements = [...jd.required, ...jd.preferred];
  if (jdRequirements.length === 0 || resume.skills.length === 0) {
    return SemanticMatchV3Schema.parse({
      matches: jdRequirements.map((r) => ({
        requirement: r.canonical,
        status: "missing",
        matchedResumeSkill: "",
        confidence: 0,
        reason: "No resume skills available to compare.",
      })),
    });
  }

  const key = process.env.LOVABLE_API_KEY;
  if (!key) return deterministicFallback(resume, jd);

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway(MODEL);

  const call = async () => {
    const { text } = await generateText({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildPrompt(resume, jd) },
      ],
    });
    return coerceMatches(parseJsonObject(text), jdRequirements);
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[semantic-match] first attempt failed, retrying once", error);
    try {
      return await call();
    } catch (error2) {
      console.error("[semantic-match] failed twice, falling back to deterministic pass", error2);
      return deterministicFallback(resume, jd);
    }
  }
}

function coerceMatches(raw: unknown, jdRequirements: Array<{ canonical: string }>): SemanticMatchV3 {
  const src = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const rawList = Array.isArray(src.matches) ? src.matches : [];
  const byReq = new Map<string, SemanticMatchEntry>();
  for (const item of rawList) {
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    const requirement = typeof rec.requirement === "string" ? rec.requirement.trim() : "";
    if (!requirement) continue;
    const statusRaw = typeof rec.status === "string" ? rec.status.trim().toLowerCase() : "missing";
    const status = (["exact", "equivalent", "related", "missing"].includes(statusRaw) ? statusRaw : "missing") as SemanticMatchEntry["status"];
    byReq.set(requirement.toLowerCase(), {
      requirement,
      status,
      matchedResumeSkill: typeof rec.matchedResumeSkill === "string" ? rec.matchedResumeSkill.trim() : "",
      confidence: clampConfidence(rec.confidence, status),
      reason: typeof rec.reason === "string" ? rec.reason.trim() : "",
    });
  }
  const merged: SemanticMatchEntry[] = jdRequirements.map((r) => {
    const hit = byReq.get(r.canonical.toLowerCase());
    if (hit) return { ...hit, requirement: r.canonical };
    return { requirement: r.canonical, status: "missing", matchedResumeSkill: "", confidence: 0, reason: "Model did not return a verdict for this requirement." };
  });
  return { matches: merged };
}

function clampConfidence(raw: unknown, status: SemanticMatchEntry["status"]): number {
  const defaults = { exact: 100, equivalent: 95, related: 80, missing: 0 } as const;
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : defaults[status as keyof typeof defaults];
  return Math.max(0, Math.min(100, n));
}

function parseJsonObject(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return {}; }
}

function deterministicFallback(resume: ParsedResumeV3, jd: ParsedJDV3): SemanticMatchV3 {
  const candidateIndex = new Map<string, string>();
  for (const s of resume.skills) {
    candidateIndex.set(s.canonical.toLowerCase(), s.canonical);
    for (const a of s.aliases) candidateIndex.set(a.toLowerCase(), s.canonical);
  }
  const jdRequirements = [...jd.required, ...jd.preferred];
  const matches: SemanticMatchEntry[] = jdRequirements.map((r) => {
    const keys = [r.canonical, ...r.aliases].map((k) => k.toLowerCase());
    for (const k of keys) {
      const hit = candidateIndex.get(k);
      if (hit) {
        const status: SemanticMatchEntry["status"] = hit.toLowerCase() === r.canonical.toLowerCase() ? "exact" : "equivalent";
        return { requirement: r.canonical, status, matchedResumeSkill: hit, confidence: status === "exact" ? 100 : 95, reason: "Deterministic alias match (LLM unavailable)." };
      }
    }
    return { requirement: r.canonical, status: "missing", matchedResumeSkill: "", confidence: 0, reason: "No alias overlap found (LLM unavailable)." };
  });
  return { matches };
}