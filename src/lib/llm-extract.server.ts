// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — LLM extractors
// ---------------------------------------------------------------------------
// Domain-agnostic resume + JD extraction. Emits fully-normalized skills
// (canonical + aliases + category) so downstream stages don't need alias
// tables or regex tokenizers.
// ---------------------------------------------------------------------------

import { generateText } from "ai";
import { createAiGatewayProvider } from "./ai-gateway.server";
import {
  ParsedJDV3Schema,
  ParsedResumeV3Schema,
  type ParsedJDV3,
  type ParsedResumeV3,
} from "./intelligence-schemas";

const MODEL = "gemini-1.5-flash";

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
  return `Return ONE JSON object with EXACTLY these keys:

{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "currentCompany": string,           // Latest employer (e.g. "Accenture")
  "currentDesignation": string,       // Latest title (e.g. "Senior Salesforce Developer")
  "totalYears": number,               // Total years of professional experience as a number
  "noticePeriod": string,             // e.g. "30 days", "Immediate", ""
  "employment": [                     // Newest first, every entry
    { "company": string, "title": string, "start": string, "end": string, "isCurrent": boolean, "summary": string }
  ],
  "education": string[],              // Each entry "Degree — Institution (Year)"
  "certifications": string[],
  "projects": string[],
  "languages": string[],
  "skills": [                         // Every skill, tool, technology, methodology, and domain competency
    { "canonical": string, "aliases": string[], "category": string, "years": number, "evidence": string[] }
  ],
  "inferredDomain": string,           // e.g. "Salesforce CRM", "Data Engineering", "Talent Acquisition", "Finance"
  "inferredSeniority": string,        // Intern | Entry Level | Junior | Mid Level | Senior | Lead | Staff | Principal | Manager | Director
  "strengths": string[],              // 3-6 recruiter-grade bullets grounded in the resume
  "risks": string[],                  // 2-4 concrete gaps or concerns grounded in the resume
  "summary": string                   // 2-3 sentence recruiter-grade profile
}

RULES:
1. Copy scalar values verbatim from the resume where possible.
2. Merge synonymous sections (Skills / Core Competencies / Areas of Expertise / Proficiencies / Technical Skills) into "skills".
3. Every skill MUST have a stable canonical name — multi-word terms stay together ("Sales Cloud", "Machine Learning", "Talent Acquisition").
4. "aliases" holds the exact spellings seen in the resume (e.g. ["LWC", "Lightning Web Component"] for "Lightning Web Components (LWC)").
5. "years" per skill: your best conservative estimate from employment context; 0 if unknown.
6. "evidence" per skill: short phrases from the resume showing where the skill appears.
7. Never invent employers, projects, or certifications.
8. Return ONLY the JSON object.

RESUME TEXT:
${resumeText.slice(0, 28000)}`;
}

function buildJdPrompt(jd: string): string {
  return `Return ONE JSON object with EXACTLY these keys:

{
  "jobTitle": string,
  "domain": string,                   // e.g. "Salesforce CRM", "Data Engineering", "Finance"
  "industry": string,
  "department": string,
  "employmentType": string,           // e.g. "Full-Time", "Contract"
  "seniorityLevel": string,           // Intern | Entry Level | Junior | Mid Level | Senior | Lead | Staff | Principal | Manager | Director
  "experienceRequired": string,       // Raw phrase e.g. "5-8 years"
  "minYears": number,                 // Parsed lower bound; 0 if none
  "maxYears": number,                 // Parsed upper bound; 0 if none
  "educationRequired": string[],
  "required": [                       // Must-have requirements
    { "canonical": string, "aliases": string[], "category": string, "weight": number }
  ],
  "preferred": [                      // Nice-to-have requirements
    { "canonical": string, "aliases": string[], "category": string, "weight": number }
  ],
  "responsibilities": string[],
  "softSkills": string[],
  "certifications": string[]
}

RULES:
1. Emit canonical industry names for every requirement (e.g. "Apex", "Lightning Web Components (LWC)", "Sales Cloud", "SAP FICO", "Apache Spark", "Talent Acquisition").
2. Multi-word terms stay together — never split "Sales Cloud" into "Sales" + "Cloud".
3. "aliases" mirrors the exact wording seen in the JD.
4. "category" is a broad tag ("Salesforce", "Data", "Cloud", "DevOps", "AI/ML", "Database", "Frontend", "Backend", "Mobile", "Security", "QA", "Recruitment", "Finance", "Product", "Marketing", "Healthcare", "Mechanical", "Soft", "Other").
5. "weight" is 1..3 — 3 for prominently emphasized skills, 1 for lightly mentioned.
6. Map "Must Have" -> required, "Good to Have"/"Nice to Have" -> preferred. If unlabeled, place in required.
7. Never invent requirements not present in the JD.
8. Return ONLY the JSON object.

JOB DESCRIPTION:
${jd.slice(0, 20000)}`;
}

export async function extractResumeV3(resumeText: string): Promise<ParsedResumeV3> {
  const key = process.env.AI_API_KEY;
  if (!key) return ParsedResumeV3Schema.parse({});
  const gateway = createAiGatewayProvider(key);
  const model = gateway(MODEL);

  const call = async () => {
    const { text } = await generateText({
      model,
      temperature: 0,
      instructions: RESUME_SYSTEM,
      prompt: buildResumePrompt(normalize(resumeText)),
    });
    return coerceParsedResume(parseJsonObject(text));
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[llm-extract] resume v3 first attempt failed, retrying once", error);
    try {
      return await call();
    } catch (error2) {
      console.error("[llm-extract] resume v3 failed twice, returning empty shell", error2);
      return ParsedResumeV3Schema.parse({});
    }
  }
}

export async function extractJDV3(jdText: string): Promise<ParsedJDV3> {
  const key = process.env.AI_API_KEY;
  if (!key) return ParsedJDV3Schema.parse({});
  const gateway = createAiGatewayProvider(key);
  const model = gateway(MODEL);

  const call = async () => {
    const { text } = await generateText({
      model,
      temperature: 0,
      instructions: JD_SYSTEM,
      prompt: buildJdPrompt(normalize(jdText)),
    });
    return coerceParsedJd(parseJsonObject(text));
  };

  try {
    return await call();
  } catch (error) {
    console.warn("[llm-extract] jd v3 first attempt failed, retrying once", error);
    try {
      return await call();
    } catch (error2) {
      console.error("[llm-extract] jd v3 failed twice, returning empty shell", error2);
      return ParsedJDV3Schema.parse({});
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

function parseJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return {};
  }
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
