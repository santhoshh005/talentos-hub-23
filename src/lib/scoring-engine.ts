// ---------------------------------------------------------------------------
// Scoring Engine
// ---------------------------------------------------------------------------
// Deterministic weighted score built from the Matching Engine + Evidence
// Engine outputs. NEVER calls AI, NEVER re-parses text.
//
// Weights:
//   0.60  Weighted skill coverage (sum of matched confidence / required)
//   0.40  Average evidence strength across matched required skills
//   * Applies non-linear exponential penalty if skill coverage is < 60%
// ---------------------------------------------------------------------------

import type { MatchingResult, SkillMatch } from "./matching-engine";
import type { SkillEvidence } from "./evidence-engine";

export interface ScoringInput {
  matching: MatchingResult;
  evidence: SkillEvidence[];
}

export interface ScoringResult {
  matchPercentage: number; // 0..100
  skillCoverage: number; // 0..100
  evidenceScore: number; // 0..100
  matchedRequired: number;
  totalRequired: number;
  averageConfidence: number;
  matchedWithEvidence: Array<SkillMatch & { evidenceStrength: number }>;
}

export function scoreMatch(input: ScoringInput): ScoringResult {
  const { matching, evidence } = input;
  const totalRequired = Math.max(0, matching.similarity.totalRequiredSkills);
  const matched = matching.matchingSkills;

  const evidenceByKey = new Map(evidence.map((e) => [e.skill.toLowerCase(), e]));
  const matchedWithEvidence = matched.map((m) => ({
    ...m,
    evidenceStrength: evidenceByKey.get(m.skill.toLowerCase())?.evidenceStrength ?? 0,
  }));

  const skillCoverage = totalRequired
    ? clamp((matched.reduce((s, m) => s + m.confidence, 0) / (totalRequired * 100)) * 100, 0, 100)
    : 0;

  const evidenceValues = matchedWithEvidence.map((m) => m.evidenceStrength).filter((v) => v > 0);
  const evidenceScore = evidenceValues.length
    ? evidenceValues.reduce((s, v) => s + v, 0) / evidenceValues.length
    : 0;

  // If we have skill matches but zero measurable evidence, don't over-punish:
  // give partial credit (30 baseline) so 100% skill-covered candidate isn't
  // pushed below 70%.
  const effectiveEvidence = matched.length > 0 && evidenceScore === 0 ? 30 : evidenceScore;

  // Fair scoring: 70% coverage, 30% evidence
  // Baseline minimum for candidates with matches to avoid artificial 3% scores
  let rawScore = 0.7 * skillCoverage + 0.3 * effectiveEvidence;
  if (matched.length > 0 && rawScore < 35) {
    rawScore = Math.max(35, rawScore);
  }

  const matchPercentage = Math.round(rawScore);

  // Dev-only diagnostic: catches accuracy regressions where the matcher
  // finds most required skills but the score still tanks.
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV !== "production" &&
    totalRequired > 0 &&
    matched.length / totalRequired >= 0.7 &&
    matchPercentage < 40
  ) {
    console.warn(
      `[Scoring] Suspicious low score: matched ${matched.length}/${totalRequired} required but score ${matchPercentage}%.`,
    );
  }

  return {
    matchPercentage: clamp(matchPercentage, 0, 100),
    skillCoverage: Math.round(skillCoverage),
    evidenceScore: Math.round(effectiveEvidence),
    matchedRequired: matched.length,
    totalRequired,
    averageConfidence: matching.confidence.averageConfidence,
    matchedWithEvidence,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
