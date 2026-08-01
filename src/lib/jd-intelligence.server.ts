import { generateText } from "ai";
import { z } from "zod";
import { getAiModel } from "./ai-gateway.server";
import { isCleanSkillToken } from "./token-sanitizer";

// ---------------------------------------------------------------------------
// JD Intelligence Engine
// ---------------------------------------------------------------------------
// Responsibility: understand and structure a Job Description.
// This service NEVER compares against a resume, calculates a match score,
// generates interview questions, or modifies candidate data.
// Its output is consumed downstream by the Skill Matching Engine.
// ---------------------------------------------------------------------------

const JdIntelligenceInputSchema = z.object({
  jobDescription: z.string().min(20),
});

const JdIntelligenceSchema = z.object({
  jobTitle: z.string().default("Not Found"),
  industry: z.string().default("Not Found"),
  department: z.string().default("Not Found"),
  employmentType: z.string().default("Not Found"),
  experienceRequired: z.string().default("Not Found"),
  educationRequired: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  domain: z.string().default("Not Found"),
  seniorityLevel: z.string().default("Not Found"),
});

export type JdIntelligence = z.infer<typeof JdIntelligenceSchema>;
type JdInput = z.infer<typeof JdIntelligenceInputSchema>;

// Headings that must NEVER appear inside any extracted field (skill, tool, etc.)
// and must never be treated as recruiter-meaningful content.
const IGNORED_HEADINGS = new Set(
  [
    "about us",
    "about the company",
    "about the role",
    "company",
    "benefits",
    "perks",
    "perks and benefits",
    "location",
    "position",
    "description",
    "job description",
    "responsibilities",
    "apply now",
    "how to apply",
    "notice",
    "notice period",
    "equal opportunity",
    "equal opportunity employer",
    "eeo",
    "diversity",
    "why join us",
    "what we offer",
    "compensation",
    "salary",
    "current",
    "parser",
    "modify",
    "resume",
    "score",
    "improve",
  ].map((s) => s.toLowerCase()),
);

const EMPLOYMENT_TYPE_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "Full-Time", regex: /\bfull[\s-]?time\b/i },
  { label: "Part-Time", regex: /\bpart[\s-]?time\b/i },
  { label: "Contract", regex: /\bcontract(?:or)?\b/i },
  { label: "Contract-to-Hire", regex: /\bcontract[\s-]?to[\s-]?hire\b/i },
  { label: "Internship", regex: /\bintern(?:ship)?\b/i },
  { label: "Temporary", regex: /\btemporary\b/i },
  { label: "Freelance", regex: /\bfreelance\b/i },
  { label: "Permanent", regex: /\bpermanent\b/i },
];

const SENIORITY_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "Intern", regex: /\bintern(?:ship)?\b/i },
  { label: "Entry Level", regex: /\bentry[\s-]?level|fresher|graduate\b/i },
  { label: "Junior", regex: /\bjunior\b/i },
  { label: "Mid Level", regex: /\bmid[\s-]?(?:level|senior)?\b/i },
  { label: "Senior", regex: /\bsenior\b/i },
  { label: "Lead", regex: /\b(?:tech(?:nical)?\s+)?lead\b/i },
  { label: "Staff", regex: /\bstaff\b/i },
  { label: "Principal", regex: /\bprincipal\b/i },
  { label: "Manager", regex: /\bmanager\b/i },
  { label: "Director", regex: /\bdirector\b/i },
  { label: "VP", regex: /\bvice\s+president|\bvp\b/i },
  { label: "Head", regex: /\bhead\s+of\b/i },
];

// Section header synonyms map to canonical buckets used by the deterministic
// fallback parser.
type SectionBucket =
  | "jobTitle"
  | "industry"
  | "department"
  | "employmentType"
  | "experienceRequired"
  | "educationRequired"
  | "requiredSkills"
  | "preferredSkills"
  | "responsibilities"
  | "tools"
  | "technologies"
  | "softSkills"
  | "certifications"
  | "domain"
  | "seniorityLevel";

const SECTION_MAP: Array<{ bucket: SectionBucket; headers: string[] }> = [
  {
    bucket: "jobTitle",
    headers: ["job title", "role title", "position title", "designation", "role"],
  },
  { bucket: "industry", headers: ["industry", "sector"] },
  { bucket: "department", headers: ["department", "team", "function", "division"] },
  {
    bucket: "employmentType",
    headers: ["employment type", "job type", "engagement type", "work type"],
  },
  {
    bucket: "experienceRequired",
    headers: ["experience", "experience required", "years of experience", "work experience"],
  },
  {
    bucket: "educationRequired",
    headers: [
      "education",
      "educational qualifications",
      "academic qualifications",
      "qualifications",
      "minimum qualifications",
    ],
  },
  {
    bucket: "requiredSkills",
    headers: [
      "required skills",
      "must have",
      "must-have",
      "mandatory skills",
      "key skills",
      "primary skills",
      "core skills",
      "technical skills",
      "skills required",
    ],
  },
  {
    bucket: "preferredSkills",
    headers: [
      "preferred skills",
      "nice to have",
      "nice-to-have",
      "good to have",
      "good-to-have",
      "desired skills",
      "additional skills",
      "secondary skills",
      "bonus skills",
    ],
  },
  {
    bucket: "responsibilities",
    headers: [
      "key responsibilities",
      "roles and responsibilities",
      "duties",
      "what you'll do",
      "what you will do",
      "day to day",
      "day-to-day",
    ],
  },
  { bucket: "tools", headers: ["tools", "tooling", "software", "platforms"] },
  { bucket: "technologies", headers: ["technologies", "tech stack", "stack", "frameworks"] },
  { bucket: "softSkills", headers: ["soft skills", "behavioral skills", "interpersonal skills"] },
  { bucket: "certifications", headers: ["certifications", "certificates", "licenses"] },
  { bucket: "domain", headers: ["domain", "domain expertise"] },
  { bucket: "seniorityLevel", headers: ["seniority", "seniority level", "level", "career level"] },
];

export async function runJdIntelligence(data: JdInput): Promise<JdIntelligence> {
  const jd = normalize(data.jobDescription);
  const local = parseJdLocally(jd);
  const model = getAiModel();
  if (!model) return finalize(local);

  try {
    const { text } = await generateText({
      model,
      temperature: 0,
      system: [
        "You are the TalentOS JD Intelligence Engine.",
        "You ONLY understand and structure a Job Description.",
        "You NEVER compare against candidates, score, or generate interview content.",
        "Divide the JD into logical sections first, then extract only recruiter-meaningful information.",
        "Skills, tools, and technologies must be atomic tokens — never headings, sentences, or generic words.",
        "Return ONLY valid JSON. No prose, no markdown.",
      ].join(" "),
      prompt: `Return ONE JSON object with EXACTLY these keys:

{
  "jobTitle": string,
  "industry": string,
  "department": string,
  "employmentType": string,          // e.g. "Full-Time", "Contract"
  "experienceRequired": string,      // e.g. "5-8 Years"
  "educationRequired": string[],     // e.g. "Bachelor Degree in Computer Science"
  "requiredSkills": string[],
  "preferredSkills": string[],
  "responsibilities": string[],
  "tools": string[],
  "technologies": string[],
  "softSkills": string[],
  "certifications": string[],
  "domain": string,                  // e.g. "Fintech", "Healthcare", "E-commerce"
  "seniorityLevel": string           // Intern | Entry | Junior | Mid | Senior | Lead | Staff | Principal | Manager | Director
}

STRICT RULES:
1. NEVER include these as any field value: About Us, Company, Benefits, Location, Position, Description, Responsibilities, Apply Now, Notice, Equal Opportunity, Current, Parser, Modify, Resume, Score, Improve.
2. Skills / tools / technologies must be short atomic tokens (e.g. "Java", "Spring Boot", "Kafka", "AWS") — never sentences, never headings, never generic words like "communication" unless clearly a soft skill in context.
3. Copy values from the JD text — never invent. If a field is absent, return "Not Found" (scalar) or [] (list).
4. If the JD explicitly separates "Must Have" and "Good To Have", map must-haves into requiredSkills and good-to-haves into preferredSkills.
5. Deduplicate across buckets. Preserve original casing where reasonable.
6. Do NOT calculate any score. Do NOT reference candidates or resumes. Do NOT generate interview questions.
7. Return the raw JSON object only.

JOB DESCRIPTION:
${jd.slice(0, 20000)}`,
    });
    return finalize(mergeJd(parseJsonObject(text), local));
  } catch (error) {
    console.error(
      "[TalentOS JD Intelligence] AI extraction failed; using deterministic parse.",
      error,
    );
    return finalize(local);
  }
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// ---------------------------------------------------------------------------

function parseJdLocally(jd: string): JdIntelligence {
  const lines = jd
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const sections = splitIntoSections(lines);

  const jobTitle = detectJobTitle(lines, sections);
  const experienceRequired = detectExperience(jd, sections);
  const employmentType = detectEmploymentType(jd, sections);
  const seniorityLevel = detectSeniority(jd, jobTitle, sections);

  const responsibilities = (sections.responsibilities ?? [])
    .map(stripBullet)
    .filter((l) => l.length >= 4);
  const educationRequired = (sections.educationRequired ?? []).map(stripBullet).filter(Boolean);
  const certifications = (sections.certifications ?? []).map(stripBullet).filter(Boolean);
  const softSkills = flattenTokens(sections.softSkills ?? []);

  const requiredSkills = flattenTokens(sections.requiredSkills ?? []);
  const preferredSkills = flattenTokens(sections.preferredSkills ?? []);
  const tools = flattenTokens(sections.tools ?? []);
  const technologies = flattenTokens(sections.technologies ?? []);

  const industry = firstScalar(sections.industry);
  const department = firstScalar(sections.department);
  const domain = firstScalar(sections.domain);

  return {
    jobTitle: jobTitle || "Not Found",
    industry: industry || "Not Found",
    department: department || "Not Found",
    employmentType: employmentType || "Not Found",
    experienceRequired: experienceRequired || "Not Found",
    educationRequired,
    requiredSkills,
    preferredSkills,
    responsibilities,
    tools,
    technologies,
    softSkills,
    certifications,
    domain: domain || "Not Found",
    seniorityLevel: seniorityLevel || "Not Found",
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
  const cleaned = line
    .toLowerCase()
    .replace(/[:*_#>\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.split(" ").length > 6) return null;
  for (const entry of SECTION_MAP) {
    for (const header of entry.headers) {
      if (
        cleaned === header ||
        cleaned.startsWith(`${header} `) ||
        cleaned.startsWith(`${header}:`)
      ) {
        return entry.bucket;
      }
    }
  }
  return null;
}

function isIgnoredHeader(line: string): boolean {
  const cleaned = line
    .toLowerCase()
    .replace(/[:*_#>\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.split(" ").length > 6) return false;
  return IGNORED_HEADINGS.has(cleaned);
}

function stripHeaderInline(line: string): string {
  const idx = line.indexOf(":");
  if (idx === -1) return "";
  return line.slice(idx + 1).trim();
}

function detectJobTitle(
  lines: string[],
  sections: Partial<Record<SectionBucket, string[]>>,
): string {
  if (sections.jobTitle && sections.jobTitle.length > 0) return sections.jobTitle[0].trim();
  for (const line of lines.slice(0, 12)) {
    const m = line.match(/^(?:job title|position|role|designation)\s*[:-]\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  for (const line of lines.slice(0, 5)) {
    if (isIgnoredHeader(line) || matchHeader(line)) continue;
    if (line.length > 3 && line.length < 90) return line.trim();
  }
  return "";
}

function detectExperience(jd: string, sections: Partial<Record<SectionBucket, string[]>>): string {
  const fromSection = (sections.experienceRequired ?? []).join(" ").trim();
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

function detectEmploymentType(
  jd: string,
  sections: Partial<Record<SectionBucket, string[]>>,
): string {
  const fromSection = (sections.employmentType ?? []).join(" ").trim();
  const scan = fromSection || jd;
  for (const p of EMPLOYMENT_TYPE_PATTERNS) if (p.regex.test(scan)) return p.label;
  return "";
}

function detectSeniority(
  jd: string,
  jobTitle: string,
  sections: Partial<Record<SectionBucket, string[]>>,
): string {
  const fromSection = (sections.seniorityLevel ?? []).join(" ").trim();
  const scan = `${fromSection} ${jobTitle} ${jd}`;
  for (const p of SENIORITY_PATTERNS) if (p.regex.test(scan)) return p.label;
  return "";
}

function firstScalar(lines?: string[]): string {
  if (!lines || lines.length === 0) return "";
  const cleaned = stripBullet(lines[0]);
  return cleaned.length < 80 ? cleaned : "";
}

function flattenTokens(lines: string[]): string[] {
  const tokens: string[] = [];
  for (const line of lines) {
    const cleaned = stripBullet(line);
    if (!cleaned) continue;
    const parts = cleaned.split(/[,;|/·•●○▪]|\s+and\s+/i).map((p) => p.trim());
    for (const part of parts) {
      if (!part) continue;
      const skill = part
        .replace(
          /^(?:experience (?:with|in|of)|knowledge of|proficiency in|hands[- ]on (?:with|in)|strong|good|excellent)\s+/i,
          "",
        )
        .trim();
      if (isValidToken(skill)) tokens.push(skill);
    }
  }
  return unique(tokens);
}

function isValidToken(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  const lower = trimmed
    .toLowerCase()
    .replace(/[:.\-–—]+$/g, "")
    .trim();
  if (IGNORED_HEADINGS.has(lower)) return false;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 8 && /[.!?]$/.test(trimmed)) return false;
  return isCleanSkillToken(trimmed);
}

function stripBullet(value: string): string {
  return value
    .replace(/^[\s•·▪●○\-*–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
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

function finalize(parsed: JdIntelligence): JdIntelligence {
  const scalar = (v: string) => (v && v.trim() ? v.trim() : "Not Found");
  const sanitizeList = (values: string[]) =>
    unique(values.map((v) => v.trim()).filter(isValidToken));
  return {
    jobTitle: scalar(parsed.jobTitle),
    industry: scalar(parsed.industry),
    department: scalar(parsed.department),
    employmentType: scalar(parsed.employmentType),
    experienceRequired: scalar(parsed.experienceRequired),
    educationRequired: sanitizeList(parsed.educationRequired),
    requiredSkills: sanitizeList(parsed.requiredSkills),
    preferredSkills: sanitizeList(parsed.preferredSkills),
    responsibilities: unique(
      parsed.responsibilities.map((r) => r.trim()).filter((r) => r.length >= 4),
    ),
    tools: sanitizeList(parsed.tools),
    technologies: sanitizeList(parsed.technologies),
    softSkills: sanitizeList(parsed.softSkills),
    certifications: sanitizeList(parsed.certifications),
    domain: scalar(parsed.domain),
    seniorityLevel: scalar(parsed.seniorityLevel),
  };
}

function mergeJd(aiValue: unknown, local: JdIntelligence): JdIntelligence {
  const src =
    typeof aiValue === "object" && aiValue !== null ? (aiValue as Record<string, unknown>) : {};
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
    industry: str("industry", local.industry),
    department: str("department", local.department),
    employmentType: str("employmentType", local.employmentType),
    experienceRequired: str("experienceRequired", local.experienceRequired),
    educationRequired: arr("educationRequired", local.educationRequired),
    requiredSkills: arr("requiredSkills", local.requiredSkills),
    preferredSkills: arr("preferredSkills", local.preferredSkills),
    responsibilities: arr("responsibilities", local.responsibilities),
    tools: arr("tools", local.tools),
    technologies: arr("technologies", local.technologies),
    softSkills: arr("softSkills", local.softSkills),
    certifications: arr("certifications", local.certifications),
    domain: str("domain", local.domain),
    seniorityLevel: str("seniorityLevel", local.seniorityLevel),
  };
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
