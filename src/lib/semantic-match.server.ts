// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — Semantic Matcher
// ---------------------------------------------------------------------------
import { generateObject } from "ai";
import { getAiModel } from "./ai-gateway.server";
import {
  SemanticMatchV3Schema,
  type ParsedJDV3,
  type ParsedResumeV3,
  type SemanticMatchEntry,
  type SemanticMatchV3,
} from "./intelligence-schemas";

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
  const resumeSkills = resume.skills.map((s) => ({
    canonical: s.canonical,
    aliases: s.aliases,
    category: s.category,
  }));
  const jdRequirements = [...jd.required, ...jd.preferred].map((r) => ({
    canonical: r.canonical,
    aliases: r.aliases,
    category: r.category,
  }));

  return `RULES:
1. Produce ONE entry for EVERY JD requirement — never skip.
2. Confidence bands: exact=100, equivalent=95, related=80, missing=0.
3. "matchedResumeSkill" MUST come from CANDIDATE_SKILLS or CANDIDATE_CONTEXT. Empty when status is "missing".
4. Be intelligent: map implied skills from candidate projects and employment context to JD requirements as "equivalent" or "related" (e.g. "Full-Stack Web Development" implies HTML, CSS, JavaScript, Web Development).

CANDIDATE_SKILLS:
${JSON.stringify(resumeSkills)}

CANDIDATE_CONTEXT:
- Employment: ${JSON.stringify(resume.employment.map((e) => `${e.title} at ${e.company} (${e.summary})`))}
- Projects: ${JSON.stringify(resume.projects)}
- Education: ${JSON.stringify(resume.education)}
- Certifications: ${JSON.stringify(resume.certifications)}

JD_REQUIREMENTS:
${JSON.stringify(jdRequirements)}`;
}

export async function runSemanticMatch(
  resume: ParsedResumeV3,
  jd: ParsedJDV3,
): Promise<SemanticMatchV3> {
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

  const model = getAiModel();
  if (!model) return deterministicFallback(resume, jd);

  const call = async () => {
    const { object } = await generateObject({
      model,
      temperature: 0,
      schema: SemanticMatchV3Schema,
      system: SYSTEM,
      prompt: buildPrompt(resume, jd),
    });
    return coerceMatches(object, jdRequirements, resume);
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[semantic-match] first attempt failed, retrying once", error);
    await delay(1000);
    try {
      return await call();
    } catch (error2) {
      console.error("[semantic-match] failed twice, falling back to deterministic pass", error2);
      return deterministicFallback(resume, jd);
    }
  }
}

function fuzzyMatch(jdSkill: string, candidateSkill: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(
        /^(certification in|familiarity with|knowledge of|experience with|understanding of)\s+/i,
        "",
      )
      .replace(/[^a-z0-9]/g, "");

  const nJd = normalize(jdSkill);
  const nCan = normalize(candidateSkill);

  if (!nJd || !nCan) return false;
  return nJd.includes(nCan) || nCan.includes(nJd);
}

function coerceMatches(
  raw: unknown,
  jdRequirements: Array<{ canonical: string }>,
  resume: ParsedResumeV3,
): SemanticMatchV3 {
  const src = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const rawList = Array.isArray(src.matches) ? src.matches : [];
  const byReq = new Map<string, SemanticMatchEntry>();

  // Build a flat list of all candidate skills for fuzzy matching
  const candidateSkills = new Set<string>();
  for (const s of resume.skills) {
    candidateSkills.add(s.canonical);
    for (const a of s.aliases) candidateSkills.add(a);
  }
  const candidateSkillsArr = Array.from(candidateSkills);

  for (const item of rawList) {
    if (typeof item !== "object" || item === null) continue;
    const rec = item as Record<string, unknown>;
    const requirement = typeof rec.requirement === "string" ? rec.requirement.trim() : "";
    if (!requirement) continue;

    const statusRaw = typeof rec.status === "string" ? rec.status.trim().toLowerCase() : "missing";
    let status = (
      ["exact", "equivalent", "related", "missing"].includes(statusRaw) ? statusRaw : "missing"
    ) as SemanticMatchEntry["status"];

    let matchedResumeSkill =
      typeof rec.matchedResumeSkill === "string" ? rec.matchedResumeSkill.trim() : "";
    let reason = typeof rec.reason === "string" ? rec.reason.trim() : "";

    // Fuzzy override if the LLM marks it missing but we can substring match it!
    if (status === "missing" || !matchedResumeSkill) {
      for (const canSkill of candidateSkillsArr) {
        if (fuzzyMatch(requirement, canSkill)) {
          status = "equivalent";
          matchedResumeSkill = canSkill;
          reason = "Fuzzy substring match (LLM override).";
          break;
        }
      }
    }

    byReq.set(requirement.toLowerCase(), {
      requirement,
      status,
      matchedResumeSkill,
      confidence: clampConfidence(rec.confidence, status),
      reason,
    });
  }

  const merged: SemanticMatchEntry[] = jdRequirements.map((r) => {
    let hit = byReq.get(r.canonical.toLowerCase());

    // If the LLM completely ignored this requirement, try to fuzzy match it ourselves
    if (!hit) {
      let fallbackStatus: SemanticMatchEntry["status"] = "missing";
      let fallbackMatched = "";
      for (const canSkill of candidateSkillsArr) {
        if (fuzzyMatch(r.canonical, canSkill)) {
          fallbackStatus = "equivalent";
          fallbackMatched = canSkill;
          break;
        }
      }
      hit = {
        requirement: r.canonical,
        status: fallbackStatus,
        matchedResumeSkill: fallbackMatched,
        confidence: fallbackStatus !== "missing" ? 95 : 0,
        reason: fallbackStatus !== "missing" ? "Fuzzy fallback." : "Model missed.",
      };
    }

    return { ...hit, requirement: r.canonical };
  });

  return { matches: merged };
}

function clampConfidence(raw: unknown, status: SemanticMatchEntry["status"]): number {
  const defaults = { exact: 100, equivalent: 95, related: 80, missing: 0 } as const;
  const n =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.round(raw)
      : defaults[status as keyof typeof defaults];
  return Math.max(0, Math.min(100, n));
}

function deterministicFallback(resume: ParsedResumeV3, jd: ParsedJDV3): SemanticMatchV3 {
  const candidateIndex = new Map<string, string>();
  for (const s of resume.skills) {
    candidateIndex.set(s.canonical.toLowerCase(), s.canonical);
    for (const a of s.aliases) candidateIndex.set(a.toLowerCase(), s.canonical);
  }
  const jdRequirements = [...jd.required, ...jd.preferred];
  const matches: SemanticMatchEntry[] = jdRequirements.map((r) => {
    // 1. Exact or strict alias match
    const keys = [r.canonical, ...r.aliases].map((k) => k.toLowerCase());
    for (const k of keys) {
      const hit = candidateIndex.get(k);
      if (hit) {
        const status: SemanticMatchEntry["status"] =
          hit.toLowerCase() === r.canonical.toLowerCase() ? "exact" : "equivalent";
        return {
          requirement: r.canonical,
          status,
          matchedResumeSkill: hit,
          confidence: status === "exact" ? 100 : 95,
          reason: "Deterministic alias match.",
        };
      }
    }

    // 2. Fuzzy fallback
    for (const [canLower, canOriginal] of candidateIndex.entries()) {
      if (fuzzyMatch(r.canonical, canOriginal)) {
        return {
          requirement: r.canonical,
          status: "equivalent",
          matchedResumeSkill: canOriginal,
          confidence: 95,
          reason: "Deterministic fuzzy match.",
        };
      }
    }

    return {
      requirement: r.canonical,
      status: "missing",
      matchedResumeSkill: "",
      confidence: 0,
      reason: "No alias or fuzzy overlap found.",
    };
  });
  return { matches };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
