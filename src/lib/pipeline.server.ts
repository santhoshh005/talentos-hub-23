// ---------------------------------------------------------------------------
// TalentOS Resume Intelligence Pipeline (orchestrator)
// ---------------------------------------------------------------------------
// Coordinates existing intelligence services. Contains NO business logic:
// no parsing, no matching, no scoring, no AI calls, no summaries.
//
// Execution order (each stage receives the previous stage's output):
//   1. Resume Parser
//   2. JD Intelligence Engine
//   3. Skill Normalization Engine
//   4. Matching Engine
//   5. Evidence Engine
//
// Future services (Scoring Engine, Recruiter Intelligence, Interview
// Intelligence, PDF Generation, ...) plug in by appending a PipelineStage
// to the stages array — existing services never change.
// ---------------------------------------------------------------------------

import { z } from "zod";
import { getAiModel } from "./ai-gateway.server";
import { generateObject } from "ai";
import { runParseResume, type ParsedResumeData } from "./resume-analyzer.server";
import { runJdIntelligence, type JdIntelligence } from "./jd-intelligence.server";
import { normalizeSkills, type SkillNormalizationOutput } from "./skill-normalizer";
import { matchSkills, type MatchingResult } from "./matching-engine";
import { buildEvidence, type SkillEvidence } from "./evidence-engine";
import { scoreMatch, type ScoringResult } from "./scoring-engine";
import { buildRecruiterIntelligence, type RecruiterIntelligence } from "./recruiter-intelligence";
import { extractResumeV3, extractJDV3 } from "./llm-extract.server";
import { runSemanticMatch } from "./semantic-match.server";
import type { ParsedJDV3, ParsedResumeV3, SemanticMatchV3 } from "./intelligence-schemas";
import type { NormalizedSkill } from "./skill-normalizer";
import type { SkillMatch } from "./matching-engine";

export const PipelineInputSchema = z.object({
  resumeText: z.string().min(20),
  jobDescription: z.string().min(20),
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

type PipelineStageName =
  | "parseAndExtract"
  | "skillNormalization"
  | "matching"
  | "evidence"
  | "scoring"
  | "recruiterIntelligence";

interface PipelineStageTiming {
  stage: PipelineStageName | string;
  durationMs: number;
  ok: boolean;
}

interface PipelineMetadata {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  stages: PipelineStageTiming[];
  version: "1.0.0";
}

interface PipelineSuccess {
  ok: true;
  resume: ParsedResumeData;
  jobDescription: JdIntelligence;
  normalizedSkills: SkillNormalizationOutput;
  matching: MatchingResult;
  evidence: SkillEvidence[];
  scoring: ScoringResult;
  intelligence: RecruiterIntelligence;
  metadata: PipelineMetadata;
}

interface PipelineFailure {
  ok: false;
  failedStage: PipelineStageName | string;
  error: { message: string; name?: string };
  metadata: PipelineMetadata;
}

export type PipelineResult = PipelineSuccess | PipelineFailure;

// A pipeline stage is a pure step name + async function that takes a mutable
// context and mutates the keys it produces. Existing services are wrapped —
// never modified — so future stages can be appended freely.
export interface PipelineStage<Ctx = PipelineContext> {
  name: PipelineStageName | string;
  run: (ctx: Ctx) => Promise<void>;
}

interface PipelineContext {
  input: PipelineInput;
  resume?: ParsedResumeData;
  jobDescription?: JdIntelligence;
  normalizedSkills?: SkillNormalizationOutput;
  matching?: MatchingResult;
  evidence?: SkillEvidence[];
  scoring?: ScoringResult;
  intelligence?: RecruiterIntelligence;
  // v3 intermediates
  resumeV3?: ParsedResumeV3;
  jdV3?: ParsedJDV3;
  semantic?: SemanticMatchV3;
}

// ---------------------------------------------------------------------------
// Default stages — thin wrappers around existing services.
// ---------------------------------------------------------------------------

const defaultPipelineStages: PipelineStage[] = [
  {
    name: "parseAndExtract",
    run: async (ctx) => {
      const [resumeV3, jdV3] = await Promise.all([
        extractResumeV3(ctx.input.resumeText),
        extractJDV3(ctx.input.jobDescription),
      ]);
      ctx.resumeV3 = resumeV3;
      ctx.jdV3 = jdV3;
      ctx.resume = adaptResumeV3ToLegacy(resumeV3);
      ctx.jobDescription = adaptJdV3ToLegacy(jdV3);
    },
  },
  {
    name: "skillNormalization",
    run: async (ctx) => {
      requireStage(ctx.resumeV3, "parseAndExtract");
      requireStage(ctx.jdV3, "parseAndExtract");
      ctx.normalizedSkills = buildNormalizedFromV3(ctx.resumeV3, ctx.jdV3);
    },
  },
  {
    name: "matching",
    run: async (ctx) => {
      requireStage(ctx.resumeV3, "parseAndExtract");
      requireStage(ctx.jdV3, "parseAndExtract");
      requireStage(ctx.normalizedSkills, "skillNormalization");
      const semantic = await runSemanticMatch(ctx.resumeV3, ctx.jdV3);
      ctx.semantic = semantic;
      ctx.matching = adaptSemanticToMatchingResult(semantic, ctx.resumeV3, ctx.jdV3);
    },
  },
  {
    name: "evidence",
    run: async (ctx) => {
      requireStage(ctx.resume, "parseAndExtract");
      requireStage(ctx.normalizedSkills, "skillNormalization");
      ctx.evidence = buildEvidence({
        resume: ctx.resume,
        normalizedSkills: ctx.normalizedSkills.resumeSkills,
      });
    },
  },
  {
    name: "scoring",
    run: async (ctx) => {
      requireStage(ctx.matching, "matching");
      requireStage(ctx.evidence, "evidence");
      ctx.scoring = scoreMatch({ matching: ctx.matching, evidence: ctx.evidence });
    },
  },
  {
    name: "recruiterIntelligence",
    run: async (ctx) => {
      requireStage(ctx.resume, "parseAndExtract");
      requireStage(ctx.jobDescription, "parseAndExtract");
      requireStage(ctx.matching, "matching");
      requireStage(ctx.evidence, "evidence");
      requireStage(ctx.scoring, "scoring");
      ctx.intelligence = buildRecruiterIntelligence({
        resume: ctx.resume,
        jd: ctx.jobDescription,
        matching: ctx.matching,
        evidence: ctx.evidence,
        scoring: ctx.scoring,
        resumeV3: ctx.resumeV3,
        jdV3: ctx.jdV3,
      });

      const aiModel = getAiModel();
      if (aiModel) {
        try {
          const { object } = await generateObject({
            model: aiModel,
            schema: z.object({
              aiFitSummary: z
                .string()
                .describe("A summary of why the candidate is a good fit or not"),
              aiInterviewQuestions: z
                .array(z.string())
                .describe("List of suggested interview questions"),
            }),
            prompt: `Based on this resume and job description, provide a fit summary and interview questions.\n\nResume: ${ctx.input.resumeText.slice(0, 10000)}\n\nJob Description: ${ctx.input.jobDescription.slice(0, 10000)}`,
          });
          ctx.intelligence.aiFitSummary = object.aiFitSummary;
          ctx.intelligence.aiInterviewQuestions = object.aiInterviewQuestions;
        } catch (err) {
          console.warn("[Pipeline] ai generation failed in recruiterIntelligence", err);
        }
      }
    },
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export async function runResumeIntelligencePipeline(
  input: PipelineInput,
  stages: PipelineStage[] = defaultPipelineStages,
): Promise<PipelineResult> {
  const validated = PipelineInputSchema.parse(input);
  const ctx: PipelineContext = { input: validated };
  const timings: PipelineStageTiming[] = [];
  const startedAt = new Date();
  const startPerf = now();

  for (const stage of stages) {
    const stageStart = now();
    try {
      await stage.run(ctx);
      const durationMs = round(now() - stageStart);
      timings.push({ stage: stage.name, durationMs, ok: true });
      console.info(`[Pipeline] ${stage.name} ok in ${durationMs}ms`);
    } catch (error) {
      const durationMs = round(now() - stageStart);
      timings.push({ stage: stage.name, durationMs, ok: false });
      const err = toError(error);
      console.error(`[Pipeline] ${stage.name} failed after ${durationMs}ms:`, err.message);
      return {
        ok: false,
        failedStage: stage.name,
        error: { message: err.message, name: err.name },
        metadata: buildMetadata(startedAt, startPerf, timings),
      };
    }
  }

  return {
    ok: true,
    resume: ctx.resume as ParsedResumeData,
    jobDescription: ctx.jobDescription as JdIntelligence,
    normalizedSkills: ctx.normalizedSkills as SkillNormalizationOutput,
    matching: ctx.matching as MatchingResult,
    evidence: ctx.evidence as SkillEvidence[],
    scoring: ctx.scoring as ScoringResult,
    intelligence: ctx.intelligence as RecruiterIntelligence,
    metadata: buildMetadata(startedAt, startPerf, timings),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMetadata(
  startedAt: Date,
  startPerf: number,
  stages: PipelineStageTiming[],
): PipelineMetadata {
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    totalDurationMs: round(now() - startPerf),
    stages,
    version: "1.0.0",
  };
}

function requireStage<T>(
  value: T | undefined,
  stage: PipelineStageName | string,
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(`Pipeline stage "${stage}" produced no output`);
  }
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(typeof value === "string" ? value : "Unknown pipeline error");
}

function now(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function round(ms: number): number {
  return Math.round(ms * 100) / 100;
}

// Silence unused-import warnings for legacy helpers kept for backwards compat.
void runParseResume;
void runJdIntelligence;
void normalizeSkills;
void matchSkills;

// ---------------------------------------------------------------------------
// v3 → legacy adapters
// ---------------------------------------------------------------------------

function adaptResumeV3ToLegacy(r: ParsedResumeV3): ParsedResumeData {
  const scalar = (v: string) => (v && v.trim() ? v.trim() : "Not Found");
  const employmentHistory = r.employment
    .map((e) => {
      const range = [e.start, e.end].filter(Boolean).join(" - ");
      const suffix = range ? ` (${range})` : "";
      return `${e.title || ""}${e.title && e.company ? " — " : ""}${e.company || ""}${suffix}`.trim();
    })
    .filter(Boolean);
  const skillNames = r.skills.map((s) => s.canonical).filter(Boolean);
  const technologyCategories = new Set([
    "Frontend",
    "Backend",
    "Cloud",
    "DevOps",
    "Data",
    "AI/ML",
    "Database",
    "Mobile",
    "QA",
  ]);
  const technologies = r.skills
    .filter((s) => technologyCategories.has(s.category))
    .map((s) => s.canonical);
  return {
    name: scalar(r.name),
    email: scalar(r.email),
    phone: scalar(r.phone),
    location: scalar(r.location),
    experience: r.totalYears > 0 ? `${r.totalYears} years` : "Not Found",
    currentCompany: scalar(r.currentCompany),
    skills: skillNames,
    education: r.education[0] ?? "Not Found",
    projects: r.projects,
    certifications: r.certifications,
    technologies,
    currentDesignation: scalar(r.currentDesignation),
    relevantExperience:
      r.relevantYears && r.relevantYears > 0 ? `${r.relevantYears} years` : "Not Found",
    employmentHistory,
    educationHistory: r.education,
    tools: [],
    languages: r.languages,
    noticePeriod: scalar(r.noticePeriod),
  };
}

function adaptJdV3ToLegacy(j: ParsedJDV3): JdIntelligence {
  const scalar = (v: string) => (v && v.trim() ? v.trim() : "Not Found");
  return {
    jobTitle: scalar(j.jobTitle),
    industry: scalar(j.industry),
    department: scalar(j.department),
    employmentType: scalar(j.employmentType),
    experienceRequired: scalar(j.experienceRequired),
    educationRequired: j.educationRequired,
    requiredSkills: j.required.map((r) => r.canonical),
    preferredSkills: j.preferred.map((r) => r.canonical),
    responsibilities: j.responsibilities,
    tools: [],
    technologies: [],
    softSkills: j.softSkills,
    certifications: j.certifications,
    domain: scalar(j.domain),
    seniorityLevel: scalar(j.seniorityLevel),
  };
}

function buildNormalizedFromV3(r: ParsedResumeV3, j: ParsedJDV3): SkillNormalizationOutput {
  const resumeSkills: NormalizedSkill[] = r.skills.map((s) => ({
    original: s.aliases[0] ?? s.canonical,
    normalized: s.canonical,
  }));
  const jdSkills: NormalizedSkill[] = [...j.required, ...j.preferred].map((s) => ({
    original: s.aliases[0] ?? s.canonical,
    normalized: s.canonical,
  }));
  return { resumeSkills, jdSkills };
}

function adaptSemanticToMatchingResult(
  semantic: SemanticMatchV3,
  resume: ParsedResumeV3,
  jd: ParsedJDV3,
): MatchingResult {
  const jdCanonicalByLower = new Map<string, string>();
  for (const r of [...jd.required, ...jd.preferred])
    jdCanonicalByLower.set(r.canonical.toLowerCase(), r.canonical);

  const matchingSkills: SkillMatch[] = [];
  const missingSet = new Set<string>();
  const matchedResumeCanonicalLower = new Set<string>();

  for (const entry of semantic.matches) {
    const jdName = jdCanonicalByLower.get(entry.requirement.toLowerCase()) ?? entry.requirement;
    if (entry.status === "missing" || !entry.matchedResumeSkill) {
      missingSet.add(jdName);
      continue;
    }
    const conf =
      entry.status === "exact"
        ? 100
        : entry.status === "equivalent"
          ? 95
          : entry.status === "related"
            ? 80
            : 80;
    const kind =
      entry.status === "exact" ? "exact" : entry.status === "equivalent" ? "alias" : "related";
    matchingSkills.push({
      skill: jdName,
      resumeOriginal: entry.matchedResumeSkill,
      jdOriginal: jdName,
      confidence: conf as 100 | 95 | 90 | 80,
      kind: kind as SkillMatch["kind"],
    });
    matchedResumeCanonicalLower.add(entry.matchedResumeSkill.toLowerCase());
  }

  matchingSkills.sort((a, b) => a.skill.localeCompare(b.skill, undefined, { sensitivity: "base" }));
  const missingSkills = Array.from(missingSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  const additionalSkills = resume.skills
    .map((s) => s.canonical)
    .filter((n) => !matchedResumeCanonicalLower.has(n.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const totalRequiredSkills = jd.required.length + jd.preferred.length;
  const matchedRequiredSkills = matchingSkills.length;
  const averageConfidence = matchingSkills.length
    ? Math.round(matchingSkills.reduce((s, m) => s + m.confidence, 0) / matchingSkills.length)
    : 0;

  return {
    matchingSkills,
    missingSkills,
    additionalSkills,
    similarity: {
      totalRequiredSkills,
      matchedRequiredSkills,
      missingRequiredSkills: missingSkills.length,
      totalResumeSkills: resume.skills.length,
      additionalSkills: additionalSkills.length,
    },
    confidence: {
      averageConfidence,
      exactMatches: matchingSkills.filter((m) => m.kind === "exact").length,
      aliasMatches: matchingSkills.filter((m) => m.kind === "alias").length,
      semanticMatches: matchingSkills.filter((m) => m.kind === "semantic").length,
      relatedMatches: matchingSkills.filter((m) => m.kind === "related").length,
    },
  };
}
