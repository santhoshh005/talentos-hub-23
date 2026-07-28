import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const JdParseInputSchema = z.object({
  jobDescription: z.string().min(20),
});

export const ParsedJobDescriptionSchema = z.object({
  jobTitle: z.string().default("Not Found"),
  summary: z.string().default("Not Found"),
  experience: z.string().default("Not Found"),
  education: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  mustHaveSkills: z.array(z.string()).default([]),
  goodToHaveSkills: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
});

export type ParsedJobDescription = z.infer<typeof ParsedJobDescriptionSchema>;

type JdInput = z.infer<typeof JdParseInputSchema>;

// Headings that must NEVER be returned as a skill or as extracted content itself.
const IGNORED_HEADINGS = new Set(
  [
    "position",
    "location",
    "description",
    "job description",
    "responsibilities",
    "key responsibilities",
    "roles and responsibilities",
    "duties",
    "requirements",
    "overview",
    "company",
    "about us",
    "about the company",
    "about the role",
    "notice",
    "notice period",
    "benefits",
    "perks",
    "perks and benefits",
    "equal opportunity employer",
    "eeo",
    "diversity",
    "why join us",
    "what we offer",
    "compensation",
    "salary",
    "work location",
    "employment type",
    "job type",
    "shift",
    "department",
    "reports to",
    "industry",
  ].map((s) => s.toLowerCase()),
);

// Section synonyms → canonical bucket.
const SECTION_MAP: Array<{ bucket: SectionBucket; headers: string[] }> = [
  { bucket: "jobTitle", headers: ["job title", "role title", "position title", "designation"] },
  { bucket: "summary", headers: ["summary", "role summary", "job summary", "role overview", "about the role"] },
  { bucket: "experience", headers: ["experience", "experience required", "years of experience", "work experience"] },
  { bucket: "responsibilities", headers: ["responsibilities", "key responsibilities", "roles and responsibilities", "duties", "what you'll do", "what you will do", "day to day"] },
  { bucket: "requiredSkills", headers: ["required skills", "required technical skills", "skills required", "key skills", "primary skills", "technical skills", "core skills"] },
  { bucket: "preferredSkills", headers: ["preferred skills", "nice to have", "nice-to-have", "desired skills", "additional skills", "secondary skills", "bonus skills", "plus", "pluses"] },
  { bucket: "mustHaveSkills", headers: ["must have", "must-have", "must have skills", "must-have skills", "mandatory skills", "mandatory"] },
  { bucket: "goodToHaveSkills", headers: ["good to have", "good-to-have", "good to have skills"] },
  { bucket: "qualifications", headers: ["qualifications", "minimum qualifications", "basic qualifications", "preferred qualifications"] },
  { bucket: "education", headers: ["education", "educational qualifications", "academic qualifications", "academics"] },
  { bucket: "tools", headers: ["tools", "tooling", "software", "platforms"] },
  { bucket: "technologies", headers: ["technologies", "tech stack", "stack", "frameworks"] },
  { bucket: "softSkills", headers: ["soft skills", "behavioral skills", "interpersonal skills"] },
  { bucket: "certifications", headers: ["certifications", "certificates", "licenses"] },
];

type SectionBucket =
  | "jobTitle"
  | "summary"
  | "experience"
  | "responsibilities"
  | "requiredSkills"
  | "preferredSkills"
  | "mustHaveSkills"
  | "goodToHaveSkills"
  | "qualifications"
  | "education"
  | "tools"
  | "technologies"
  | "softSkills"
  | "certifications";

export async function runParseJobDescription(data: JdInput): Promise<ParsedJobDescription> {
  const jd = normalize(data.jobDescription);
  const local = parseJdLocally(jd);
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return finalize(local);

  try {
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      temperature: 0,
      instructions: [
        "You are TalentOS Job Description Parser.",
        "First divide the JD into logical sections, THEN extract only recruiter-meaningful content.",
        "Skills must be atomic tools, technologies, frameworks, methodologies, or domain competencies — NEVER a heading, sentence, or generic word.",
        "Return ONLY valid JSON. No prose, no markdown fences.",
      ].join(" "),
      prompt: `Return ONE JSON object with EXACTLY these keys:

{
  "jobTitle": string,             // e.g. "Java Full Stack Developer"
  "summary": string,              // 1–3 sentence role summary
  "experience": string,           // e.g. "5-8 Years"
  "responsibilities": string[],   // Each bullet as a clean sentence
  "requiredSkills": string[],     // Atomic skills only
  "preferredSkills": string[],
  "mustHaveSkills": string[],
  "goodToHaveSkills": string[],
  "qualifications": string[],
  "education": string[],          // e.g. "Bachelor Degree in Computer Science"
  "tools": string[],
  "technologies": string[],
  "softSkills": string[],
  "certifications": string[]
}

STRICT RULES:
1. NEVER include these as skills or as any list item: Position, Location, Description, Responsibilities, Requirements, Overview, Company, About Us, Notice, Notice Period, Benefits, Equal Opportunity Employer, Perks, Compensation, Salary, Work Location, Employment Type, Job Type, Shift, Department, Reports To, Industry, Why Join Us, What We Offer.
2. Skills must be short atomic tokens (e.g. "Java", "Spring Boot", "Kafka", "AWS") — not sentences, not headings.
3. Copy values from the JD text — never invent. If a section is absent, return "Not Found" (scalar) or [] (list).
4. If the JD says "Must Have" and "Good To Have" separately, populate BOTH mustHaveSkills and goodToHaveSkills. Also mirror mustHaves into requiredSkills, and goodToHaves into preferredSkills.
5. If only "Required" is written, populate requiredSkills only.
6. Deduplicate across buckets and preserve original casing where reasonable.
7. Return the raw JSON object only.

JOB DESCRIPTION:
${jd.slice(0, 20000)}`,
    });
    return finalize(mergeJd(parseJsonObject(text), local));
  } catch (error) {
    console.error("[TalentOS JD parser] AI extraction failed; using deterministic parse.", error);
    return finalize(local);
  }
}

function finalize(parsed: ParsedJobDescription): ParsedJobDescription {
  const scalar = (v: string) => (v && v.trim() ? v.trim() : "Not Found");
  const sanitizeList = (values: string[]) =>
    unique(values.map((v) => v.trim()).filter(isValidSkillCandidate));
  return {
    jobTitle: scalar(parsed.jobTitle),
    summary: scalar(parsed.summary),
    experience: scalar(parsed.experience),
    education: sanitizeList(parsed.education),
    responsibilities: unique(parsed.responsibilities.map((r) => r.trim()).filter((r) => r.length >= 4)),
    requiredSkills: sanitizeList(parsed.requiredSkills),
    preferredSkills: sanitizeList(parsed.preferredSkills),
    mustHaveSkills: sanitizeList(parsed.mustHaveSkills),
    goodToHaveSkills: sanitizeList(parsed.goodToHaveSkills),
    qualifications: sanitizeList(parsed.qualifications),
    tools: sanitizeList(parsed.tools),
    technologies: sanitizeList(parsed.technologies),
    softSkills: sanitizeList(parsed.softSkills),
    certifications: sanitizeList(parsed.certifications),
  };
}

function isValidSkillCandidate(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  const lower = trimmed.toLowerCase().replace(/[:.\-–—]+$/g, "").trim();
  if (IGNORED_HEADINGS.has(lower)) return false;
  // Reject if it's a full sentence (long + ends with period or contains many words that read like prose).
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 8 && /[.!?]$/.test(trimmed)) return false;
  return true;
}

function parseJdLocally(jd: string): ParsedJobDescription {
  const lines = jd.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections = splitIntoSections(lines);

  const jobTitle = detectJobTitle(lines, sections);
  const summary = sections.summary?.join(" ").trim() || "";
  const experience = detectExperience(jd, sections);

  const responsibilities = (sections.responsibilities ?? []).map(stripBullet).filter((l) => l.length >= 4);
  const education = (sections.education ?? []).map(stripBullet).filter(Boolean);
  const qualifications = (sections.qualifications ?? []).map(stripBullet).filter(Boolean);
  const softSkills = flattenTokens(sections.softSkills ?? []);
  const certifications = (sections.certifications ?? []).map(stripBullet).filter(Boolean);

  const requiredSkills = flattenTokens(sections.requiredSkills ?? []);
  const preferredSkills = flattenTokens(sections.preferredSkills ?? []);
  const mustHaveSkills = flattenTokens(sections.mustHaveSkills ?? []);
  const goodToHaveSkills = flattenTokens(sections.goodToHaveSkills ?? []);
  const tools = flattenTokens(sections.tools ?? []);
  const technologies = flattenTokens(sections.technologies ?? []);

  // Mirror must/good into required/preferred so downstream consumers always have a canonical bucket.
  const mergedRequired = unique([...requiredSkills, ...mustHaveSkills]);
  const mergedPreferred = unique([...preferredSkills, ...goodToHaveSkills]);

  return {
    jobTitle: jobTitle || "Not Found",
    summary: summary || "Not Found",
    experience: experience || "Not Found",
    education,
    responsibilities,
    requiredSkills: mergedRequired,
    preferredSkills: mergedPreferred,
    mustHaveSkills,
    goodToHaveSkills,
    qualifications,
    tools,
    technologies,
    softSkills,
    certifications,
  };
}

function splitIntoSections(lines: string[]): Partial<Record<SectionBucket, string[]>> {
  const buckets: Partial<Record<SectionBucket, string[]>> = {};
  let current: SectionBucket | null = null;
  let currentIsIgnored = false;

  for (const raw of lines) {
    const headerBucket = matchHeader(raw);
    const ignored = isIgnoredHeader(raw);
    if (headerBucket) {
      current = headerBucket;
      currentIsIgnored = false;
      if (!buckets[current]) buckets[current] = [];
      // Some JDs put content on the same line: "Experience: 5-8 Years"
      const inline = stripHeaderInline(raw);
      if (inline) buckets[current]!.push(inline);
      continue;
    }
    if (ignored) {
      current = null;
      currentIsIgnored = true;
      continue;
    }
    if (current && !currentIsIgnored) {
      buckets[current]!.push(raw);
    }
  }
  return buckets;
}

function matchHeader(line: string): SectionBucket | null {
  const cleaned = line.toLowerCase().replace(/[:*_#>\-–—]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  // Header lines are short — reject long prose.
  if (cleaned.split(" ").length > 6) return null;
  for (const entry of SECTION_MAP) {
    for (const header of entry.headers) {
      if (cleaned === header || cleaned.startsWith(`${header} `) || cleaned.startsWith(`${header}:`)) {
        return entry.bucket;
      }
    }
  }
  return null;
}

function isIgnoredHeader(line: string): boolean {
  const cleaned = line.toLowerCase().replace(/[:*_#>\-–—]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return false;
  if (cleaned.split(" ").length > 6) return false;
  return IGNORED_HEADINGS.has(cleaned);
}

function stripHeaderInline(line: string): string {
  const idx = line.indexOf(":");
  if (idx === -1) return "";
  return line.slice(idx + 1).trim();
}

function detectJobTitle(lines: string[], sections: Partial<Record<SectionBucket, string[]>>): string {
  if (sections.jobTitle && sections.jobTitle.length > 0) return sections.jobTitle[0].trim();
  // Try "Position: X" or "Job Title: X" anywhere in the top of the JD.
  for (const line of lines.slice(0, 12)) {
    const m = line.match(/^(?:job title|position|role|designation)\s*[:\-]\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  // Fallback: first meaningful non-header line.
  for (const line of lines.slice(0, 5)) {
    if (isIgnoredHeader(line) || matchHeader(line)) continue;
    if (line.length > 3 && line.length < 90) return line.trim();
  }
  return "";
}

function detectExperience(jd: string, sections: Partial<Record<SectionBucket, string[]>>): string {
  const fromSection = (sections.experience ?? []).join(" ").trim();
  if (fromSection) {
    const m = fromSection.match(/\d+\s*(?:[-–to]+\s*\d+)?\+?\s*(?:years?|yrs?)/i);
    if (m) return m[0].replace(/\s+/g, " ").trim();
    if (fromSection.length < 60) return fromSection;
  }
  const inline = jd.match(/\b\d+\s*(?:[-–]|to)\s*\d+\+?\s*(?:years?|yrs?)/i);
  if (inline) return inline[0].replace(/\s+/g, " ").trim();
  const single = jd.match(/\b\d+\+?\s*(?:years?|yrs?)\b/i);
  return single ? single[0] : "";
}

function flattenTokens(lines: string[]): string[] {
  const tokens: string[] = [];
  for (const line of lines) {
    const cleaned = stripBullet(line);
    if (!cleaned) continue;
    // Split on common list separators.
    const parts = cleaned.split(/[,;|/·•●○▪]|\s+and\s+/i).map((p) => p.trim());
    for (const part of parts) {
      if (!part) continue;
      // Drop leading verbs / connectors typical of responsibility bullets.
      const skill = part.replace(/^(?:experience (?:with|in|of)|knowledge of|proficiency in|hands[- ]on (?:with|in)|strong|good|excellent)\s+/i, "").trim();
      if (isValidSkillCandidate(skill)) tokens.push(skill);
    }
  }
  return unique(tokens);
}

function stripBullet(value: string): string {
  return value.replace(/^[\s•·▪●○\-*–—]+/, "").replace(/\s+/g, " ").trim();
}

function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\t]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = v.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(v.trim());
  }
  return out;
}

function mergeJd(aiValue: unknown, local: ParsedJobDescription): ParsedJobDescription {
  const src = typeof aiValue === "object" && aiValue !== null ? (aiValue as Record<string, unknown>) : {};
  const str = (k: string, fallback: string) => {
    const v = src[k];
    return typeof v === "string" && v.trim() ? v.trim() : fallback;
  };
  const arr = (k: string, fallback: string[]) => {
    const v = src[k];
    if (Array.isArray(v)) {
      const cleaned = v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
      return unique([...cleaned, ...fallback]);
    }
    return fallback;
  };

  return {
    jobTitle: str("jobTitle", local.jobTitle),
    summary: str("summary", local.summary),
    experience: str("experience", local.experience),
    responsibilities: arr("responsibilities", local.responsibilities),
    requiredSkills: arr("requiredSkills", local.requiredSkills),
    preferredSkills: arr("preferredSkills", local.preferredSkills),
    mustHaveSkills: arr("mustHaveSkills", local.mustHaveSkills),
    goodToHaveSkills: arr("goodToHaveSkills", local.goodToHaveSkills),
    qualifications: arr("qualifications", local.qualifications),
    education: arr("education", local.education),
    tools: arr("tools", local.tools),
    technologies: arr("technologies", local.technologies),
    softSkills: arr("softSkills", local.softSkills),
    certifications: arr("certifications", local.certifications),
  };
}

function parseJsonObject(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return {};
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return {};
  }
}