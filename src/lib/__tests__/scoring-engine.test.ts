import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreMatch, scoreExperience, type RequirementMeta } from "../scoring-engine.ts";
import type { MatchingResult, SkillMatch } from "../matching-engine.ts";
import type { SkillEvidence } from "../evidence-engine.ts";

const match = (skill: string, kind: SkillMatch["kind"] = "exact"): SkillMatch => ({
  skill,
  resumeOriginal: skill,
  jdOriginal: skill,
  confidence: kind === "exact" ? 100 : kind === "related" ? 80 : 95,
  kind,
});

const matching = (matched: SkillMatch[], missing: string[]): MatchingResult => ({
  matchingSkills: matched,
  missingSkills: missing,
  additionalSkills: [],
  similarity: {
    totalRequiredSkills: matched.length + missing.length,
    matchedRequiredSkills: matched.length,
    missingRequiredSkills: missing.length,
    totalResumeSkills: 10,
    additionalSkills: 0,
  },
  confidence: {
    averageConfidence: 100,
    exactMatches: 0,
    aliasMatches: 0,
    semanticMatches: 0,
    relatedMatches: 0,
  },
});

const evidence = (skills: string[], strength = 80): SkillEvidence[] =>
  skills.map((skill) => ({
    skill,
    evidenceStrength: strength,
    foundIn: [],
    occurrenceCount: 3,
    yearsReferenced: 3,
  }));

const requirements: Record<string, RequirementMeta> = {
  react: { weight: 3, required: true },
  typescript: { weight: 2, required: true },
  node: { weight: 2, required: true },
  graphql: { weight: 1, required: false },
  aws: { weight: 1, required: false },
};
const inBand = { candidateYears: 6, minYears: 5, maxYears: 8 };

describe("scoreMatch", () => {
  it("scores a strong, well-evidenced candidate highly", () => {
    const all = ["React", "TypeScript", "Node", "GraphQL"];
    const r = scoreMatch({
      matching: matching(
        all.map((s) => match(s)),
        ["AWS"],
      ),
      evidence: evidence(all),
      requirements,
      experience: inBand,
    });
    assert.ok(r.matchPercentage >= 85, `got ${r.matchPercentage}`);
    assert.equal(r.requiredCoverage, 100);
    assert.deepEqual(r.missingPreferred, ["AWS"]);
    assert.deepEqual(r.missingRequired, []);
  });

  it("caps the score when a critical must-have is missing", () => {
    const has = ["TypeScript", "Node", "GraphQL", "AWS"];
    const r = scoreMatch({
      matching: matching(
        has.map((s) => match(s)),
        ["React"],
      ),
      evidence: evidence(has, 100),
      requirements,
      experience: inBand,
    });
    assert.ok(r.matchPercentage <= 72, `got ${r.matchPercentage}`);
    assert.deepEqual(r.criticalGaps, ["React"]);
  });

  it("keeps a candidate with no matches near zero (no artificial floor)", () => {
    const r = scoreMatch({
      matching: matching([], ["React", "TypeScript", "Node"]),
      evidence: [],
      requirements,
      experience: inBand,
    });
    assert.ok(r.matchPercentage <= 15, `got ${r.matchPercentage}`);
  });

  it("penalises under-experience", () => {
    const skills = ["React", "TypeScript", "Node"];
    const base = {
      matching: matching(
        skills.map((s) => match(s)),
        [],
      ),
      evidence: evidence(skills),
      requirements,
    };
    const junior = scoreMatch({ ...base, experience: { ...inBand, candidateYears: 1 } });
    const fit = scoreMatch({ ...base, experience: inBand });
    assert.ok(junior.matchPercentage < fit.matchPercentage);
  });

  it("gives related matches less credit than exact ones", () => {
    const exact = scoreMatch({
      matching: matching([match("React"), match("TypeScript"), match("Node")], []),
      evidence: evidence(["React", "TypeScript", "Node"]),
      requirements,
    });
    const related = scoreMatch({
      matching: matching([match("React", "related"), match("TypeScript"), match("Node")], []),
      evidence: evidence(["React", "TypeScript", "Node"]),
      requirements,
    });
    assert.ok(related.requiredCoverage < exact.requiredCoverage);
    assert.ok(related.matchPercentage < exact.matchPercentage);
  });

  it("finds evidence via the resume's own skill name for equivalent matches", () => {
    const m: SkillMatch = { ...match("React"), resumeOriginal: "ReactJS", kind: "alias" };
    const r = scoreMatch({ matching: matching([m], []), evidence: evidence(["ReactJS"], 90) });
    assert.equal(r.matchedWithEvidence[0].evidenceStrength, 90);
  });

  it("works without requirement metadata and normalises weights to 1", () => {
    const r = scoreMatch({ matching: matching([match("A"), match("B")], ["C"]), evidence: [] });
    const total = r.breakdown.reduce((s, c) => s + c.weight, 0);
    assert.ok(Math.abs(total - 1) < 0.02, `weights sum to ${total}`);
    assert.equal(r.totalRequired, 3);
    assert.equal(r.matchedRequired, 2);
  });

  it("stays within 0..100 on empty input", () => {
    const r = scoreMatch({ matching: matching([], []), evidence: [] });
    assert.ok(r.matchPercentage >= 0 && r.matchPercentage <= 100);
  });
});

describe("scoreExperience", () => {
  it("returns null when years are unknown", () => {
    assert.equal(scoreExperience({ candidateYears: 0, minYears: 3, maxYears: 5 }), null);
    assert.equal(scoreExperience({ candidateYears: 4, minYears: 0, maxYears: 0 }), null);
  });
  it("is 100 inside the band and mildly lower when far over", () => {
    assert.equal(scoreExperience({ candidateYears: 4, minYears: 3, maxYears: 5 }), 100);
    const over = scoreExperience({ candidateYears: 15, minYears: 3, maxYears: 5 });
    assert.ok(over !== null && over >= 70 && over < 100);
  });
});
