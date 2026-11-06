import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fuzzyMatch } from "../skill-fuzzy.ts";
import { checkJDQuality } from "../jd-quality.ts";
import { aggregateUserStats } from "../usage-stats.ts";
import {
  ParsedJDV3Schema,
  ParsedResumeV3Schema,
  SemanticMatchV3Schema,
} from "../intelligence-schemas.ts";
import { tokenExpiryMs } from "../auth-store.ts";

describe("fuzzyMatch", () => {
  const cases: Array<[string, string, boolean]> = [
    ["Java", "JavaScript", false],
    ["R", "React", false],
    ["Go", "Google Analytics", false],
    ["C", "C#", false],
    ["Cloud", "Sales Cloud", false],
    ["SQL", "NoSQL", false],
    ["Node.js", "NodeJS", true],
    ["React", "React.js", true],
    ["CI/CD", "CICD", true],
    ["Experience with Docker", "Docker", true],
    ["Spring Boot Framework", "Spring Boot", true],
    ["Python", "python", true],
  ];
  for (const [a, b, expected] of cases) {
    it(`${a} ~ ${b} → ${expected}`, () => assert.equal(fuzzyMatch(a, b), expected));
  }
});

describe("checkJDQuality", () => {
  const good = [
    "# Senior Engineer",
    "## About the Role",
    "You will own our data platform. ".repeat(20),
    "## Key Responsibilities",
    "- Build pipelines in Python and Airflow",
    "## What You Bring (Must-Haves)",
    "- 5+ years of Python",
    "## Nice to Have",
    "- Kubernetes",
    "Extra context. ".repeat(60),
  ].join("\n");

  it("passes a clean, complete JD", () => {
    const r = checkJDQuality(good, "Python, Airflow");
    assert.deepEqual(r.missingSkills, []);
    assert.ok(r.score >= 90, `got ${r.score}`);
  });

  it("flags exclusionary wording and uncovered must-haves", () => {
    const r = checkJDQuality(good + "\nWe want a coding ninja. He will lead.", "Python, Rust");
    assert.deepEqual(r.missingSkills, ["Rust"]);
    assert.ok(r.issues.some((i) => i.message.includes("ninja")));
    assert.ok(r.issues.some((i) => i.message.toLowerCase().includes("pronoun")));
    assert.ok(r.score < 90);
  });

  it("does not flag pronoun-like substrings inside words", () => {
    const r = checkJDQuality(good + "\nThe team shares their work.", "");
    assert.ok(!r.issues.some((i) => i.message.toLowerCase().includes("pronoun")));
  });
});

describe("aggregateUserStats", () => {
  it("aggregates counts, scores, buckets and techs", () => {
    const s = aggregateUserStats([
      {
        id: "1",
        event_type: "analysis",
        created_at: "2026-11-01T10:00:00Z",
        metadata: { score: 90, techs: ["React", "AWS"], title: "Dev" },
      },
      {
        id: "2",
        event_type: "analysis",
        created_at: "2026-11-01T09:00:00Z",
        metadata: { score: 50, techs: ["React"] },
      },
      { id: "3", event_type: "analysis", created_at: "2026-11-01T08:00:00Z", metadata: {} },
      { id: "4", event_type: "jd_generation", created_at: "2026-11-01T07:00:00Z", metadata: null },
      { id: "5", event_type: "report_download", created_at: "bad-date", metadata: {} },
    ]);
    assert.equal(s.analyses, 3);
    assert.equal(s.scoredCount, 2);
    assert.equal(s.averageScore, 70);
    assert.deepEqual(s.scoreBuckets, { strong: 1, good: 0, review: 1, low: 0 });
    assert.deepEqual(s.techs, { React: 2, AWS: 1 });
    assert.equal(s.jds, 1);
    assert.equal(s.reports, 1);
    assert.equal(s.recent[0].label, "Resume analyzed for Dev");
    assert.equal(s.recent.length, 5);
  });
});

describe("intelligence schemas (zod 4)", () => {
  it("fills defaults for partial AI output", () => {
    const r = ParsedResumeV3Schema.parse({ name: "A", skills: [{ canonical: "React" }] });
    assert.equal(r.totalYears, 0);
    assert.deepEqual(r.skills[0].aliases, []);
    assert.equal(r.skills[0].category, "Other");
    const j = ParsedJDV3Schema.parse({ required: [{ canonical: "Go" }] });
    assert.equal(j.required[0].weight, 1);
    assert.deepEqual(j.preferred, []);
    assert.deepEqual(SemanticMatchV3Schema.parse({}).matches, []);
  });

  it("rejects invalid match statuses", () => {
    assert.throws(() =>
      SemanticMatchV3Schema.parse({ matches: [{ requirement: "x", status: "bogus" }] }),
    );
  });
});

describe("tokenExpiryMs", () => {
  const b64url = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

  it("reads the exp claim", () => {
    const token = `${b64url({ alg: "HS256" })}.${b64url({ exp: 1_800_000_000 })}.sig`;
    assert.equal(tokenExpiryMs(token), 1_800_000_000_000);
  });
  it("returns null for malformed tokens", () => {
    assert.equal(tokenExpiryMs("not-a-jwt"), null);
    assert.equal(tokenExpiryMs("a.%%%.c"), null);
  });
});
