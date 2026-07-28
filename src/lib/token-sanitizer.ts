// ---------------------------------------------------------------------------
// Token Sanitizer
// ---------------------------------------------------------------------------
// Deterministic helpers that reject non-skill junk (date ranges, month names,
// pure numbers, generic phrases) from any list that should only contain
// atomic skill / tool / technology tokens. Pure, framework-free, no side
// effects — shared by JD Intelligence, Skill Normalization, and any future
// extractor.
// ---------------------------------------------------------------------------

const MONTHS_RE =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:[a-z]*)\b/i;

const DATE_RANGE_RE =
  /(\d{4}\s*[-–to/]{1,3}\s*(?:\d{4}|present|current|now))|((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})/i;

const PURE_NUMBER_RE = /^\s*\d[\d,./\s-]*\s*$/;

const GENERIC_JUNK = new Set(
  [
    "present", "current", "now", "n/a", "na", "none", "yes", "no",
    "responsibilities", "duties", "description", "location", "company",
    "candidate", "resume", "job", "role", "position", "notice", "salary",
    "compensation", "benefits", "employer",
  ].map((s) => s.toLowerCase()),
);

export function looksLikeDate(value: string): boolean {
  if (!value) return false;
  if (DATE_RANGE_RE.test(value)) return true;
  const stripped = value.replace(/[.,()]/g, " ").trim();
  if (MONTHS_RE.test(stripped) && /\d/.test(stripped)) return true;
  return false;
}

export function isCleanSkillToken(value: string): boolean {
  if (!value) return false;
  const t = value.trim();
  if (t.length < 2 || t.length > 60) return false;
  if (PURE_NUMBER_RE.test(t)) return false;
  if (looksLikeDate(t)) return false;
  if (GENERIC_JUNK.has(t.toLowerCase())) return false;
  // Reject tokens dominated by digits (e.g. "2020 - 2024", "3 years")
  const digitRatio = (t.match(/\d/g)?.length ?? 0) / t.length;
  if (digitRatio > 0.4) return false;
  // Reject full sentences (multiple clauses)
  if ((t.match(/[.!?]/g)?.length ?? 0) >= 2) return false;
  // Must contain a letter
  if (!/[A-Za-z]/.test(t)) return false;
  return true;
}

export function sanitizeSkillList(values: string[]): string[] {
  return values.filter(isCleanSkillToken);
}

// ---------------------------------------------------------------------------
// Deterministic helpers used by the Recruiter Intelligence Engine
// ---------------------------------------------------------------------------

export function extractYearsFromExperience(value: string): number {
  if (!value) return 0;
  const m = value.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

export function seniorityFromYears(years: number): string {
  if (years <= 0) return "Not Specified";
  if (years < 2) return "Junior";
  if (years < 5) return "Mid Level";
  if (years < 8) return "Senior";
  if (years < 12) return "Lead";
  return "Principal";
}