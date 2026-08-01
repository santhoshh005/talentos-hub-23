// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — LLM extractors
// ---------------------------------------------------------------------------
// Domain-agnostic resume + JD extraction. Emits fully-normalized skills
// (canonical + aliases + category) so downstream stages don't need alias
// tables or regex tokenizers.
// ---------------------------------------------------------------------------

import { generateObject } from "ai";
import { getAiModel } from "./ai-gateway.server";
import {
  ParsedJDV3Schema,
  ParsedResumeV3Schema,
  type ParsedJDV3,
  type ParsedResumeV3,
} from "./intelligence-schemas";
import { parseResumeLocally } from "./resume-analyzer.server";
import { parseJdLocally } from "./jd-intelligence.server";

const RESUME_SYSTEM = [
  "You are TalentOS Resume Extractor v3.",
  "You read a raw resume for ANY domain (IT, Salesforce, SAP, Data, DevOps, HR/Talent Acquisition,",
  "Finance, Healthcare, Manufacturing, Mechanical, Legal, Marketing, Sales, Executive, Freshers).",
  "Your ONLY job is to extract structured facts as strict JSON.",
  'Never invent values, never translate, never guess. If a field is absent, use "" or [].',
  'Skills MUST be emitted as canonical industry names (e.g. "Sales Cloud", "Lightning Web Components (LWC)",',
  '"SAP FICO", "Apache Spark", "Talent Acquisition", "Financial Modeling") along with the ALIASES',
  'actually seen in the text and a broad CATEGORY tag (e.g. "Salesforce", "Frontend", "Data",',
  '"Cloud", "DevOps", "AI/ML", "Database", "Mobile", "Security", "QA", "Recruitment",',
  '"Finance", "Product", "Marketing", "Healthcare", "Mechanical", "Soft", "Other").',
  "Return ONLY raw JSON — no markdown, no prose.",
].join(" ");

const JD_SYSTEM = [
  "You are TalentOS JD Extractor v3.",
  "You read a raw job description for ANY domain and emit strict JSON.",
  "Split requirements into required vs preferred. Emit each requirement with canonical + aliases + category + weight.",
  'Never invent values. If a field is absent, use "" or [] or 0.',
  "Return ONLY raw JSON — no markdown, no prose.",
].join(" ");

function buildResumePrompt(resumeText: string): string {
  return `Extract the structured facts from this resume.\n\nRESUME TEXT:\n${resumeText.slice(0, 28000)}`;
}

function buildJdPrompt(jdText: string): string {
  return `Extract the structured facts from this job description.\n\nJOB DESCRIPTION TEXT:\n${jdText.slice(0, 28000)}`;
}

export async function extractResumeV3(resumeText: string): Promise<ParsedResumeV3> {
  const model = getAiModel();

  const fallback = () => {
    const legacy = parseResumeLocally(resumeText);
    const combinedSkills = Array.from(new Set([...arr(legacy.skills), ...arr(legacy.technologies)]));
    const skills = combinedSkills.map((s) => coerceSkillEntry(str(s)));
    const education = legacy.educationHistory ? arr(legacy.educationHistory).map(str) : (legacy.education ? [str(legacy.education)] : []);
    const employment = legacy.employmentHistory ? arr(legacy.employmentHistory).map(str).map(e => ({
      company: "",
      title: e,
      start: "",
      end: "",
      isCurrent: false,
      description: []
    })) : [];
    
    return ParsedResumeV3Schema.parse({
      name: str(legacy.name),
      email: str(legacy.email),
      phone: str(legacy.phone),
      location: str(legacy.location),
      currentCompany: str(legacy.currentCompany),
      currentDesignation: str(legacy.currentDesignation),
      totalYears: num(legacy.experience),
      relevantYears: 0,
      noticePeriod: str(legacy.noticePeriod),
      employment,
      education,
      certifications: strArr(legacy.certifications),
      projects: strArr(legacy.projects),
      languages: strArr(legacy.languages),
      skills: dedupeSkills(skills),
      inferredDomain: "",
      inferredSeniority: "",
      strengths: [],
      risks: [],
      summary: "",
    });
  };

  if (!model) return fallback();

  const call = async () => {
    const { object } = await generateObject({
      model,
      temperature: 0,
      schema: ParsedResumeV3Schema,
      system: RESUME_SYSTEM,
      prompt: buildResumePrompt(normalize(resumeText)),
    });
    return coerceParsedResume(object);
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[llm-extract] resume v3 first attempt failed, retrying once", error);
    await delay(1000);
    try {
      return await call();
    } catch (error2) {
      console.error("[llm-extract] resume v3 failed twice, returning local parse", error2);
      return fallback();
    }
  }
}

export async function extractJDV3(jdText: string): Promise<ParsedJDV3> {
  const model = getAiModel();

  const fallback = () => {
    const legacy = parseJdLocally(jdText);
    const required = arr(legacy.requiredSkills).map((s) => coerceRequirement(str(s)));
    const preferred = arr(legacy.preferredSkills).map((s) => coerceRequirement(str(s)));
    
    return ParsedJDV3Schema.parse({
      jobTitle: str(legacy.jobTitle),
      domain: str(legacy.domain),
      industry: str(legacy.industry),
      department: str(legacy.department),
      employmentType: str(legacy.employmentType),
      seniorityLevel: str(legacy.seniorityLevel),
      experienceRequired: str(legacy.experienceRequired),
      minYears: 0,
      maxYears: 0,
      educationRequired: strArr(legacy.educationRequired),
      required: dedupeRequirements(required),
      preferred: dedupeRequirements(preferred),
      responsibilities: strArr(legacy.responsibilities),
      softSkills: strArr(legacy.softSkills),
      certifications: strArr(legacy.certifications),
    });
  };

  if (!model) return fallback();

  const call = async () => {
    const { object } = await generateObject({
      model,
      temperature: 0,
      schema: ParsedJDV3Schema,
      system: JD_SYSTEM,
      prompt: buildJdPrompt(normalize(jdText)),
    });
    return coerceParsedJd(object);
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[llm-extract] jd v3 first attempt failed, retrying once", error);
    await delay(1000);
    try {
      return await call();
    } catch (error2) {
      console.error("[llm-extract] jd v3 failed twice, returning local parse", error2);
      return fallback();
    }
  }
}

// ---------------------------------------------------------------------------
// Coercion — LLM output → strict schema, tolerating drift
// ---------------------------------------------------------------------------

function coerceParsedResume(raw: unknown): ParsedResumeV3 {
  const src = obj(raw);
  const skills = arr(src.skills)
    .map((s) => coerceSkillEntry(s))
    .filter((s) => s.canonical);
  const employment = arr(src.employment)
    .map((e) => coerceEmployment(e))
    .filter((e) => e.company);
  return ParsedResumeV3Schema.parse({
    name: str(src.name),
    email: str(src.email),
    phone: str(src.phone),
    location: str(src.location),
    currentCompany:
      str(src.currentCompany) ||
      employment.find((e) => e.isCurrent)?.company ||
      employment[0]?.company ||
      "",
    currentDesignation:
      str(src.currentDesignation) ||
      employment.find((e) => e.isCurrent)?.title ||
      employment[0]?.title ||
      "",
    totalYears: num(src.totalYears),
    relevantYears: num(src.relevantYears),
    noticePeriod: str(src.noticePeriod),
    employment,
    education: strArr(src.education),
    certifications: strArr(src.certifications),
    projects: strArr(src.projects),
    languages: strArr(src.languages),
    skills: dedupeSkills(skills),
    inferredDomain: str(src.inferredDomain),
    inferredSeniority: str(src.inferredSeniority),
    strengths: strArr(src.strengths),
    risks: strArr(src.risks),
    summary: str(src.summary),
  });
}

function coerceParsedJd(raw: unknown): ParsedJDV3 {
  const src = obj(raw);
  const required = arr(src.required)
    .map((r) => coerceRequirement(r))
    .filter((r) => r.canonical);
  const preferred = arr(src.preferred)
    .map((r) => coerceRequirement(r))
    .filter((r) => r.canonical);
  return ParsedJDV3Schema.parse({
    jobTitle: str(src.jobTitle),
    domain: str(src.domain),
    industry: str(src.industry),
    department: str(src.department),
    employmentType: str(src.employmentType),
    seniorityLevel: str(src.seniorityLevel),
    experienceRequired: str(src.experienceRequired),
    minYears: num(src.minYears),
    maxYears: num(src.maxYears),
    educationRequired: strArr(src.educationRequired),
    required: dedupeRequirements(required),
    preferred: dedupeRequirements(preferred),
    responsibilities: strArr(src.responsibilities),
    softSkills: strArr(src.softSkills),
    certifications: strArr(src.certifications),
  });
}

function coerceSkillEntry(raw: unknown) {
  if (typeof raw === "string") {
    return { canonical: raw.trim(), aliases: [], category: "Other", years: 0, evidence: [] };
  }
  const src = obj(raw);
  return {
    canonical: str(src.canonical).trim(),
    aliases: strArr(src.aliases),
    category: str(src.category) || "Other",
    years: num(src.years),
    evidence: strArr(src.evidence),
  };
}

function coerceRequirement(raw: unknown) {
  if (typeof raw === "string") {
    return { canonical: raw.trim(), aliases: [], category: "Other", weight: 1 };
  }
  const src = obj(raw);
  const weight = Math.max(1, Math.min(3, Math.round(num(src.weight)) || 1));
  return {
    canonical: str(src.canonical).trim(),
    aliases: strArr(src.aliases),
    category: str(src.category) || "Other",
    weight,
  };
}

function coerceEmployment(raw: unknown) {
  const src = obj(raw);
  return {
    company: str(src.company),
    title: str(src.title),
    start: str(src.start),
    end: str(src.end),
    isCurrent: Boolean(src.isCurrent) || /present|current/i.test(str(src.end)),
    summary: str(src.summary),
  };
}

function dedupeSkills<T extends { canonical: string; aliases: string[] }>(list: T[]): T[] {
  const seen = new Map<string, T>();
  for (const s of list) {
    const key = s.canonical.toLowerCase();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, s);
    } else {
      const merged = new Set([...existing.aliases, ...s.aliases]);
      existing.aliases = Array.from(merged);
    }
  }
  return Array.from(seen.values());
}

function dedupeRequirements<T extends { canonical: string; aliases: string[]; weight: number }>(
  list: T[],
): T[] {
  const seen = new Map<string, T>();
  for (const r of list) {
    const key = r.canonical.toLowerCase();
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, r);
    } else {
      existing.aliases = Array.from(new Set([...existing.aliases, ...r.aliases]));
      existing.weight = Math.max(existing.weight, r.weight);
    }
  }
  return Array.from(seen.values());
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\t]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function obj(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
