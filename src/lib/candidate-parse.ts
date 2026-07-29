import type { CandidateRecord, EducationEntry, EmploymentEntry } from "./candidate-schemas";
import { sanitizeSkillList } from "./token-sanitizer";

// Deterministic, browser-safe resume parser. Produces a partial CandidateRecord
// used to seed and back-fill the LLM extraction so recruiters never see an
// empty snapshot.

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/[A-Za-z0-9\-_/%.]+/i;
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9\-_/.]+/i;
const PORTFOLIO_RE = /https?:\/\/[A-Za-z0-9.\-_/%?=&+#]+/i;
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/;
const PASSPORT_RE = /\b[A-PR-WYa-pr-wy][0-9]{7}\b/;
const YEARS_RE = /(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\b/i;
const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[-–—to]{1,3}\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4}|present|current|now)/i;

const DEGREE_KEYWORDS = [
  "b.tech",
  "btech",
  "b.e",
  "b.e.",
  "be ",
  "bachelor",
  "bsc",
  "b.sc",
  "bca",
  "mba",
  "m.tech",
  "mtech",
  "m.e",
  "m.sc",
  "msc",
  "mca",
  "phd",
  "ph.d",
  "diploma",
];

const SKILL_SECTION_HEADS = [
  "technical skills",
  "core skills",
  "key skills",
  "primary skills",
  "secondary skills",
  "skills",
  "tools",
  "technologies",
  "tech stack",
];
const EXPERIENCE_HEADS = ["experience", "work experience", "professional experience", "employment"];
const EDUCATION_HEADS = ["education", "academics", "qualification", "qualifications"];
const CERT_HEADS = ["certification", "certifications", "courses"];

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim());
}

function findSection(lines: string[], heads: string[]): { start: number; end: number } | null {
  const lowered = lines.map((l) => l.toLowerCase());
  let start = -1;
  for (let i = 0; i < lowered.length; i++) {
    const l = lowered[i].replace(/[:*_\-•]+/g, "").trim();
    if (heads.some((h) => l === h || l.startsWith(h + " "))) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  // Find next section-like header
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const l = lowered[i].replace(/[:*_\-•]+/g, "").trim();
    const isHeader =
      l.length > 0 &&
      l.length < 40 &&
      [
        ...SKILL_SECTION_HEADS,
        ...EXPERIENCE_HEADS,
        ...EDUCATION_HEADS,
        ...CERT_HEADS,
        "projects",
        "summary",
        "profile",
        "objective",
        "achievements",
        "awards",
        "languages",
        "personal details",
        "declaration",
      ].some((h) => l === h || l.startsWith(h + " "));
    if (isHeader && i !== start - 1 && !heads.some((h) => l === h || l.startsWith(h + " "))) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function pickName(lines: string[]): string {
  for (const raw of lines.slice(0, 12)) {
    const line = raw.trim();
    if (!line || line.length > 60) continue;
    if (EMAIL_RE.test(line) || PHONE_RE.test(line)) continue;
    if (/\d/.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    if (words.every((w) => /^[A-Z][A-Za-z.'-]*$/.test(w) || /^[A-Z.'-]+$/.test(w))) {
      return line.replace(/\s+/g, " ");
    }
  }
  return "";
}

function extractLabeled(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n\\r]+)`, "i");
    const m = text.match(re);
    if (m)
      return m[1]
        .trim()
        .replace(/[·|].*$/, "")
        .trim();
  }
  return "";
}

function extractSkills(lines: string[]): string[] {
  const section = findSection(lines, SKILL_SECTION_HEADS);
  if (!section) return [];
  const raw = lines.slice(section.start, section.end).join("\n");
  const tokens = raw
    .split(/[,|•·;\n/]+/)
    .map((t) => t.replace(/^[\s\-•*]+/, "").trim())
    .filter(Boolean);
  return sanitizeSkillList(tokens).slice(0, 40);
}

function extractEducation(lines: string[]): EducationEntry[] {
  const section = findSection(lines, EDUCATION_HEADS);
  if (!section) return [];
  const chunk = lines.slice(section.start, section.end).filter(Boolean);
  const out: EducationEntry[] = [];
  for (const line of chunk) {
    const l = line.toLowerCase();
    if (!DEGREE_KEYWORDS.some((d) => l.includes(d))) continue;
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    out.push({
      degree: line.split(/[,•|]/)[0].trim().slice(0, 80),
      institution: (line.split(/[,•|]/)[1] || "").trim().slice(0, 100),
      year: yearMatch ? yearMatch[0] : "",
    });
    if (out.length >= 4) break;
  }
  return out;
}

function extractCertifications(lines: string[]): string[] {
  const section = findSection(lines, CERT_HEADS);
  if (!section) return [];
  return lines
    .slice(section.start, section.end)
    .map((l) => l.replace(/^[\s\-•*·]+/, "").trim())
    .filter((l) => l.length > 3 && l.length < 140)
    .slice(0, 8);
}

function extractEmployment(lines: string[]): {
  current: { company: string; title: string };
  previous: EmploymentEntry[];
} {
  const section = findSection(lines, EXPERIENCE_HEADS);
  const empty = { current: { company: "", title: "" }, previous: [] as EmploymentEntry[] };
  if (!section) return empty;
  const chunk = lines.slice(section.start, section.end);
  const entries: EmploymentEntry[] = [];
  let currentEntry: EmploymentEntry | null = null;

  for (const raw of chunk) {
    const line = raw.trim();
    if (!line) continue;
    const dateMatch = line.match(DATE_RANGE_RE);
    if (dateMatch) {
      // New entry — pull title/company from same or previous line
      const before = line
        .replace(dateMatch[0], "")
        .replace(/[|·•\-–—]+$/, "")
        .trim();
      const parts = before.split(/\s+[-–—@|]\s+|\s{2,}/).filter(Boolean);
      const entry: EmploymentEntry = {
        title: parts[0]?.slice(0, 80) ?? "",
        company: parts[1]?.slice(0, 80) ?? "",
        start: dateMatch[1] ?? "",
        end: dateMatch[2] ?? "",
        isCurrent: /present|current|now/i.test(dateMatch[2] ?? ""),
      };
      entries.push(entry);
      currentEntry = entry;
    } else if (currentEntry && !currentEntry.company && line.length < 80 && !/^[-•*]/.test(line)) {
      currentEntry.company = line;
    }
  }

  const currentIdx = entries.findIndex((e) => e.isCurrent);
  const currentEmp = currentIdx >= 0 ? entries[currentIdx] : null;
  const previous = entries.filter((_, i) => i !== currentIdx);
  return {
    current: {
      company: currentEmp?.company ?? "",
      title: currentEmp?.title ?? "",
    },
    previous,
  };
}

export function parseCandidateText(text: string): Partial<CandidateRecord> {
  if (!text || text.trim().length < 20) return {};
  const lines = splitLines(text);
  const head = lines.slice(0, 30).join("\n");

  const email = (head.match(EMAIL_RE) ?? text.match(EMAIL_RE))?.[0] ?? "";
  const phoneMatch = (head.match(PHONE_RE) ?? text.match(PHONE_RE))?.[0] ?? "";
  const mobile = phoneMatch.replace(/[^\d+]/g, "").length >= 8 ? phoneMatch.trim() : "";
  const linkedin = text.match(LINKEDIN_RE)?.[0] ?? "";
  const github = text.match(GITHUB_RE)?.[0] ?? "";
  const portfolioMatch = text.match(PORTFOLIO_RE)?.[0];
  const portfolio =
    portfolioMatch && !/linkedin|github/i.test(portfolioMatch) ? portfolioMatch : "";
  const pan = text.match(PAN_RE)?.[0] ?? "";
  const passport = text.match(PASSPORT_RE)?.[0] ?? "";

  const fullName = pickName(lines);
  const skills = extractSkills(lines);
  const education = extractEducation(lines);
  const certifications = extractCertifications(lines);
  const { current, previous } = extractEmployment(lines);

  const yearsMatch = text.match(YEARS_RE);
  const totalExperience = yearsMatch ? `${yearsMatch[1]} years` : "";

  const currentLocation = extractLabeled(text, ["current location", "location", "address"]);
  const preferredLocation = extractLabeled(text, ["preferred location"]);
  const noticePeriod = extractLabeled(text, ["notice period", "notice"]);
  const currentCTC = extractLabeled(text, ["current ctc", "current salary", "ctc"]);
  const expectedCTC = extractLabeled(text, ["expected ctc", "expected salary"]);
  const visaStatus = extractLabeled(text, ["visa status", "visa"]);
  const employmentType = extractLabeled(text, ["employment type"]);

  const seed: Partial<CandidateRecord> = {
    fullName,
    email,
    mobile,
    linkedin,
    github,
    portfolio,
    pan,
    passport,
    currentCompany: current.company,
    currentDesignation: current.title,
    previousEmployment: previous,
    totalExperience,
    primarySkills: skills.slice(0, 10),
    secondarySkills: skills.slice(10, 25),
    currentLocation,
    preferredLocation,
    noticePeriod,
    currentCTC,
    expectedCTC,
    visaStatus,
    employmentType,
    education,
    certifications,
  };

  // Strip empties so merge helpers can distinguish absent vs cleared
  return Object.fromEntries(
    Object.entries(seed).filter(([, v]) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== "" && v != null;
    }),
  ) as Partial<CandidateRecord>;
}

// Merge two candidate records preferring populated values from `primary`,
// then falling back to `fallback`. Arrays: primary wins when non-empty.
export function mergeCandidate(
  primary: Partial<CandidateRecord>,
  fallback: Partial<CandidateRecord>,
): Partial<CandidateRecord> {
  const out: Record<string, unknown> = { ...fallback, ...primary };
  for (const key of Object.keys({ ...primary, ...fallback })) {
    const p = (primary as Record<string, unknown>)[key];
    const f = (fallback as Record<string, unknown>)[key];
    if (Array.isArray(p) || Array.isArray(f)) {
      const pa = Array.isArray(p) ? p : [];
      const fa = Array.isArray(f) ? f : [];
      out[key] = pa.length > 0 ? pa : fa;
    } else if (typeof p === "string" || typeof f === "string") {
      const ps = typeof p === "string" ? p.trim() : "";
      const fs = typeof f === "string" ? f.trim() : "";
      out[key] = ps.length > 0 ? ps : fs;
    }
  }
  return out as Partial<CandidateRecord>;
}
