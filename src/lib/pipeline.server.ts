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
import { runParseResume, type ParsedResumeData } from "./resume-analyzer.server";
import { runJdIntelligence, type JdIntelligence } from "./jd-intelligence.server";
import { normalizeSkills, type SkillNormalizationOutput } from "./skill-normalizer";
import { matchSkills, type MatchingResult } from "./matching-engine";
import { buildEvidence, type SkillEvidence } from "./evidence-engine";

export const PipelineInputSchema = z.object({
  resumeText: z.string().min(20),
  jobDescription: z.string().min(20),
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

export type PipelineStageName =
  | "resumeParser"
  | "jdIntelligence"
  | "skillNormalization"
  | "matching"
  | "evidence";

export interface PipelineStageTiming {
  stage: PipelineStageName | string;
  durationMs: number;
  ok: boolean;
}

export interface PipelineMetadata {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  stages: PipelineStageTiming[];
  version: "1.0.0";
}

export interface PipelineSuccess {
  ok: true;
  resume: ParsedResumeData;
  jobDescription: JdIntelligence;
  normalizedSkills: SkillNormalizationOutput;
  matching: MatchingResult;
  evidence: SkillEvidence[];
  metadata: PipelineMetadata;
}

export interface PipelineFailure {
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

export interface PipelineContext {
  input: PipelineInput;
  resume?: ParsedResumeData;
  jobDescription?: JdIntelligence;
  normalizedSkills?: SkillNormalizationOutput;
  matching?: MatchingResult;
  evidence?: SkillEvidence[];
}

// ---------------------------------------------------------------------------
// Default stages — thin wrappers around existing services.
// ---------------------------------------------------------------------------

export const defaultPipelineStages: PipelineStage[] = [
  {
    name: "resumeParser",
    run: async (ctx) => {
      ctx.resume = await runParseResume({ resumeText: ctx.input.resumeText });
    },
  },
  {
    name: "jdIntelligence",
    run: async (ctx) => {
      ctx.jobDescription = await runJdIntelligence({ jobDescription: ctx.input.jobDescription });
    },
  },
  {
    name: "skillNormalization",
    run: async (ctx) => {
      requireStage(ctx.resume, "resumeParser");
      requireStage(ctx.jobDescription, "jdIntelligence");
      ctx.normalizedSkills = normalizeSkills({
        resume: ctx.resume,
        jd: ctx.jobDescription,
      });
    },
  },
  {
    name: "matching",
    run: async (ctx) => {
      requireStage(ctx.normalizedSkills, "skillNormalization");
      ctx.matching = matchSkills({
        resumeSkills: ctx.normalizedSkills.resumeSkills,
        jdSkills: ctx.normalizedSkills.jdSkills,
      });
    },
  },
  {
    name: "evidence",
    run: async (ctx) => {
      requireStage(ctx.resume, "resumeParser");
      requireStage(ctx.normalizedSkills, "skillNormalization");
      ctx.evidence = buildEvidence({
        resume: ctx.resume,
        normalizedSkills: ctx.normalizedSkills.resumeSkills,
      });
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

function requireStage<T>(value: T | undefined, stage: PipelineStageName | string): asserts value is T {
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