// ---------------------------------------------------------------------------
// Evidence Engine
// ---------------------------------------------------------------------------
// Deterministic service that measures how strongly each normalized resume
// skill is supported by the structured resume.
//
// This engine NEVER:
//   - compares against the Job Description
//   - calculates match scores or hiring recommendations
//   - calls an AI model
//   - generates summaries
//
// Its structured output is consumed by the future Scoring Engine.
// ---------------------------------------------------------------------------

import type { NormalizedSkill } from "./skill-normalizer";
import { normalizeSkill } from "./skill-normalizer";

export type EvidenceSource =
  | "Professional Summary"
  | "Skills"
  | "Technical Skills"
  | "Core Competencies"
  | "Employment History"
  | "Projects"
  | "Responsibilities"
  | "Certifications"
  | "Education";

export interface SkillEvidence {
  skill: string;
  evidenceStrength: number;      // 0-100
  foundIn: EvidenceSource[];
  occurrenceCount: number;
  yearsReferenced: number;       // total years spanned by employment entries mentioning the skill
}

export interface EvidenceEngineInput {
  resume: unknown;               // Structured Resume JSON (ParsedResumeData shape or compatible)
  normalizedSkills: NormalizedSkill[];
}

// Section weighting. Higher = stronger evidence when a skill appears there.
const SECTION_WEIGHTS: Record<EvidenceSource, number> = {
  "Employment History": 22,
  Projects: 20,
  Responsibilities: 18,
  Certifications: 15,
  "Technical Skills": 10,
  "Core Competencies": 10,
  Skills: 8,
  "Professional Summary": 8,
  Education: 6,
};

// Map resume fields → the EvidenceSource label they represent.
const FIELD_SOURCES: Array<{ field: string; source: EvidenceSource }> = [
  { field: "summary", source: "Professional Summary" },
  { field: "professionalSummary", source: "Professional Summary" },
  { field: "skills", source: "Skills" },
  { field: "technicalSkills", source: "Technical Skills" },
  { field: "technologies", source: "Technical Skills" },
  { field: "tools", source: "Technical Skills" },
  { field: "coreCompetencies", source: "Core Competencies" },
  { field: "employmentHistory", source: "Employment History" },
  { field: "experience", source: "Employment History" },
  { field: "currentCompany", source: "Employment History" },
  { field: "currentDesignation", source: "Employment History" },
  { field: "projects", source: "Projects" },
  { field: "responsibilities", source: "Responsibilities" },
  { field: "certifications", source: "Certifications" },
  { field: "education", source: "Education" },
  { field: "educationHistory", source: "Education" },
];

/**
 * Build a structured evidence object for every normalized resume skill.
 * Deterministic and pure. Does not compare against the JD.
 */
export function buildEvidence(input: EvidenceEngineInput): SkillEvidence[] {
  const resume = (input.resume ?? {}) as Record<string, unknown>;
  const sections = collectSectionTexts(resume);
  const employmentEntries = collectStrings(resume["employmentHistory"] ?? resume["experience"]);

  const seen = new Set<string>();
  const results: SkillEvidence[] = [];

  for (const item of input.normalizedSkills ?? []) {
    if (!item?.normalized) continue;
    const skill = item.normalized;
    const dedupeKey = skill.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const foundIn: EvidenceSource[] = [];
    let occurrenceCount = 0;

    for (const [source, texts] of sections) {
      let sectionHits = 0;
      for (const text of texts) sectionHits += countOccurrences(text, skill);
      if (sectionHits > 0) {
        if (!foundIn.includes(source)) foundIn.push(source);
        occurrenceCount += sectionHits;
      }
    }

    const yearsReferenced = computeYearsReferenced(employmentEntries, skill);
    const evidenceStrength = scoreEvidence(foundIn, occurrenceCount, yearsReferenced);

    results.push({
      skill,
      evidenceStrength,
      foundIn: dedupeOrdered(foundIn),
      occurrenceCount,
      yearsReferenced: round1(yearsReferenced),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreEvidence(sources: EvidenceSource[], occurrences: number, years: number): number {
  if (sources.length === 0 && occurrences === 0) return 0;

  // Section coverage weight (max ≈ 60)
  const sectionScore = Math.min(
    60,
    sources.reduce((sum, s) => sum + (SECTION_WEIGHTS[s] ?? 0), 0),
  );

  // Frequency weight (max 20) — diminishing returns after 5 mentions.
  const frequencyScore = Math.min(20, Math.round(Math.log2(Math.max(1, occurrences) + 1) * 8));

  // Tenure weight (max 20) — 0.5 years ≈ 5, 4+ years saturates.
  const yearsScore = Math.min(20, Math.round(years * 5));

  return Math.max(0, Math.min(100, sectionScore + frequencyScore + yearsScore));
}

// ---------------------------------------------------------------------------
// Section collection & search
// ---------------------------------------------------------------------------

function collectSectionTexts(resume: Record<string, unknown>): Array<[EvidenceSource, string[]]> {
  const map = new Map<EvidenceSource, string[]>();
  for (const { field, source } of FIELD_SOURCES) {
    if (!(field in resume)) continue;
    const strings = collectStrings(resume[field]);
    if (strings.length === 0) continue;
    const existing = map.get(source) ?? [];
    existing.push(...strings);
    map.set(source, existing);
  }
  return Array.from(map.entries());
}

function collectStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return value.trim() ? [value] : [];
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const v of value) out.push(...collectStrings(v));
    return out;
  }
  if (typeof value === "object") {
    const out: string[] = [];
    for (const v of Object.values(value as Record<string, unknown>)) {
      out.push(...collectStrings(v));
    }
    return out;
  }
  return [];
}

function countOccurrences(text: string, skill: string): number {
  if (!text || !skill) return 0;
  // Match against both the canonical form and its normalized alias so
  // resume text like "ReactJS" still counts as evidence for "React".
  const forms = new Set<string>([skill]);
  // Look for any token in the text that normalizes to this skill.
  const tokenRegex = /[A-Za-z][A-Za-z0-9+.#/\-]*(?:\s[A-Za-z][A-Za-z0-9+.#/\-]*){0,3}/g;
  const target = skill.toLowerCase();
  let count = 0;
  const matches = text.match(tokenRegex) ?? [];
  for (const m of matches) {
    if (m.toLowerCase() === target) {
      count += 1;
      continue;
    }
    if (normalizeSkill(m).toLowerCase() === target) count += 1;
  }
  // Also do a case-insensitive word-boundary check for the canonical form
  // itself (covers punctuation like "Node.js" that the token regex may split).
  for (const form of forms) {
    const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "gi");
    const literalCount = (text.match(re) ?? []).length;
    if (literalCount > count) count = literalCount;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Years referenced
// ---------------------------------------------------------------------------

function computeYearsReferenced(employmentEntries: string[], skill: string): number {
  let total = 0;
  for (const entry of employmentEntries) {
    if (countOccurrences(entry, skill) === 0) continue;
    total += extractYearsFromEntry(entry);
  }
  return total;
}

// Handles formats like:
//   "Java Developer — Acme (Jan 2020 - Mar 2024)"
//   "Recruiter, Xevyte, 2021-2023"
//   "Backend Engineer (2 years)"
function extractYearsFromEntry(entry: string): number {
  const explicit = entry.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/i);
  if (explicit) return parseFloat(explicit[1]);

  const range = entry.match(
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(\d{4})\s*[-–to]{1,3}\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+)?(\d{4}|present|current)/i,
  );
  if (range) {
    const startYear = parseInt(range[2], 10);
    const endToken = range[4].toLowerCase();
    const endYear =
      endToken === "present" || endToken === "current" ? new Date().getFullYear() : parseInt(endToken, 10);
    if (Number.isFinite(startYear) && Number.isFinite(endYear) && endYear >= startYear) {
      return Math.max(0.25, endYear - startYear);
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function dedupeOrdered<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}