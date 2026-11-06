// ---------------------------------------------------------------------------
// Scoring Engine
// ---------------------------------------------------------------------------
// Deterministic, explainable match score built from the Matching Engine +
// Evidence Engine outputs. NEVER calls AI, NEVER re-parses text.
//
// Components (weights are renormalised when a component has no data):
//   0.55  Must-have coverage   — importance-weighted (JD weight 1..3) credit
//   0.10  Nice-to-have coverage
//   0.20  Evidence depth       — how strongly matched must-haves are proven
//   0.15  Experience fit       — candidate years vs the JD's required range
//
// Match credit per requirement: exact 1.0, equivalent 0.95, related 0.7.
// Knock-out rule: each missing critical (weight 3) must-have caps the score,
// so a candidate cannot be "Highly Recommended" while lacking a core skill.
// ---------------------------------------------------------------------------

import type { MatchingResult, SkillMatch } from "./matching-engine";
import type { SkillEvidence } from "./evidence-engine";

export interface RequirementMeta {
  /** Importance from the JD: 1 nice-to-have, 2 important, 3 critical. */
  weight: number;
  /** true for must-have requirements, false for preferred ones. */
  required: boolean;
}

export interface ExperienceInput {
  candidateYears: number;
  minYears: number;
  maxYears: number;
}

export interface ScoringInput {
  matching: MatchingResult;
  evidence: SkillEvidence[];
  /** Keyed by lower-cased JD canonical skill. Missing → every skill is a weight-1 must-have. */
  requirements?: Record<string, RequirementMeta>;
  experience?: ExperienceInput | null;
}

export interface ScoreComponent {
  key: "required" | "preferred" | "evidence" | "experience";
  label: string;
  score: number; // 0..100
  weight: number; // effective weight after renormalisation, 0..1
}

export interface ScoringResult {
  matchPercentage: number; // 0..100
  skillCoverage: number; // 0..100 — weighted coverage across all JD skills
  evidenceScore: number; // 0..100
  matchedRequired: number;
  totalRequired: number;
  averageConfidence: number;
  matchedWithEvidence: Array<SkillMatch & { evidenceStrength: number }>;
  requiredCoverage: number; // 0..100
  preferredCoverage: number | null; // null when the JD lists no preferred skills
  experienceFit: number | null; // null when years are unknown
  missingRequired: string[];
  missingPreferred: string[];
  criticalGaps: string[];
  breakdown: ScoreComponent[];
}

const BASE_WEIGHTS = { required: 0.55, preferred: 0.1, evidence: 0.2, experience: 0.15 } as const;
const MATCH_CREDIT: Record<SkillMatch["kind"], number> = {
  exact: 1,
  alias: 0.95,
  semantic: 0.9,
  related: 0.7,
};
/** Listed-but-unproven skills still earn some evidence credit. */
const LISTED_ONLY_EVIDENCE = 30;
const CRITICAL_GAP_CAPS = [100, 72, 58, 45];

export function scoreMatch(input: ScoringInput): ScoringResult {
  const { matching, evidence, requirements, experience } = input;

  const evidenceByKey = new Map(evidence.map((e) => [e.skill.toLowerCase(), e]));
  const evidenceFor = (m: SkillMatch): number => {
    const hit =
      evidenceByKey.get(m.skill.toLowerCase()) ?? evidenceByKey.get(m.resumeOriginal.toLowerCase());
    return hit?.evidenceStrength ?? 0;
  };

  const matchedWithEvidence = matching.matchingSkills.map((m) => ({
    ...m,
    evidenceStrength: evidenceFor(m),
  }));
  const matchByKey = new Map(matchedWithEvidence.map((m) => [m.skill.toLowerCase(), m]));

  // Universe of JD requirements: every matched + missing skill.
  const allSkills = dedupe([
    ...matching.matchingSkills.map((m) => m.skill),
    ...matching.missingSkills,
  ]);
  const metaFor = (skill: string): RequirementMeta => {
    const meta = requirements?.[skill.toLowerCase()];
    return {
      weight: clamp(Math.round(meta?.weight ?? 1), 1, 3),
      required: meta?.required ?? true,
    };
  };

  let reqW = 0;
  let reqCredit = 0;
  let prefW = 0;
  let prefCredit = 0;
  let evW = 0;
  let evSum = 0;
  let matchedRequired = 0;
  let totalRequired = 0;
  const missingRequired: string[] = [];
  const missingPreferred: string[] = [];
  const criticalGaps: string[] = [];

  for (const skill of allSkills) {
    const { weight, required } = metaFor(skill);
    const match = matchByKey.get(skill.toLowerCase());
    const credit = match ? MATCH_CREDIT[match.kind] : 0;

    if (required) {
      totalRequired += 1;
      reqW += weight;
      reqCredit += weight * credit;
      if (match) {
        matchedRequired += 1;
        evW += weight;
        evSum +=
          weight * (match.evidenceStrength > 0 ? match.evidenceStrength : LISTED_ONLY_EVIDENCE);
      } else {
        missingRequired.push(skill);
        if (weight >= 3) criticalGaps.push(skill);
      }
    } else {
      prefW += weight;
      prefCredit += weight * credit;
      if (!match) missingPreferred.push(skill);
    }
  }

  // Preferred-only JDs (no must-haves flagged) — treat preferred as the bar.
  const requiredCoverage =
    reqW > 0 ? (reqCredit / reqW) * 100 : prefW > 0 ? (prefCredit / prefW) * 100 : 0;
  const preferredCoverage = prefW > 0 && reqW > 0 ? (prefCredit / prefW) * 100 : null;
  if (reqW === 0 && evW === 0) {
    // Evidence for preferred-only JDs.
    for (const m of matchedWithEvidence) {
      evW += 1;
      evSum += m.evidenceStrength > 0 ? m.evidenceStrength : LISTED_ONLY_EVIDENCE;
    }
  }
  const evidenceScore = evW > 0 ? evSum / evW : 0;
  const experienceFit = experience ? scoreExperience(experience) : null;

  const candidates: Array<{
    key: ScoreComponent["key"];
    label: string;
    score: number;
    base: number;
    active: boolean;
  }> = [
    {
      key: "required",
      label: "Must-have skills",
      score: requiredCoverage,
      base: BASE_WEIGHTS.required,
      active: allSkills.length > 0,
    },
    {
      key: "preferred",
      label: "Nice-to-have skills",
      score: preferredCoverage ?? 0,
      base: BASE_WEIGHTS.preferred,
      active: preferredCoverage !== null,
    },
    {
      key: "evidence",
      label: "Evidence depth",
      score: evidenceScore,
      base: BASE_WEIGHTS.evidence,
      active: evW > 0,
    },
    {
      key: "experience",
      label: "Experience fit",
      score: experienceFit ?? 0,
      base: BASE_WEIGHTS.experience,
      active: experienceFit !== null,
    },
  ];
  const active = candidates.filter((c) => c.active);
  const activeWeight = active.reduce((s, c) => s + c.base, 0);
  const breakdown: ScoreComponent[] = active.map((c) => ({
    key: c.key,
    label: c.label,
    score: Math.round(c.score),
    weight: activeWeight > 0 ? round2(c.base / activeWeight) : 0,
  }));

  let raw = active.reduce(
    (s, c) => s + c.score * (activeWeight > 0 ? c.base / activeWeight : 0),
    0,
  );
  // When nothing matched, experience alone must not float the score.
  if (matching.matchingSkills.length === 0 && allSkills.length > 0) raw = Math.min(raw, 15);
  const cap = CRITICAL_GAP_CAPS[Math.min(criticalGaps.length, CRITICAL_GAP_CAPS.length - 1)];
  const matchPercentage = clamp(Math.round(Math.min(raw, cap)), 0, 100);

  const totalW = reqW + prefW;
  const skillCoverage = totalW > 0 ? ((reqCredit + prefCredit) / totalW) * 100 : 0;

  return {
    matchPercentage,
    skillCoverage: Math.round(skillCoverage),
    evidenceScore: Math.round(evidenceScore),
    matchedRequired,
    totalRequired,
    averageConfidence: matching.confidence.averageConfidence,
    matchedWithEvidence,
    requiredCoverage: Math.round(requiredCoverage),
    preferredCoverage: preferredCoverage === null ? null : Math.round(preferredCoverage),
    experienceFit: experienceFit === null ? null : Math.round(experienceFit),
    missingRequired,
    missingPreferred,
    criticalGaps,
    breakdown,
  };
}

/**
 * 100 inside the band; smooth falloff when under-experienced; mild penalty
 * when far over the range (flight-risk / cost mismatch, not disqualifying).
 */
export function scoreExperience({
  candidateYears,
  minYears,
  maxYears,
}: ExperienceInput): number | null {
  if (!(candidateYears > 0)) return null;
  const min = Math.max(0, minYears || 0);
  const max = maxYears && maxYears >= min ? maxYears : min > 0 ? min + 4 : 0;
  if (min === 0 && max === 0) return null;
  if (candidateYears < min) {
    return clamp(100 * Math.pow(candidateYears / min, 1.6), 0, 100);
  }
  const over = candidateYears - (max + 2);
  if (max > 0 && over > 0) return clamp(100 - over * 4, 70, 100);
  return 100;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    const k = v.toLowerCase();
    if (!v || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
