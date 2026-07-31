import { createServerFn } from "@tanstack/react-start";
import {
  PipelineInputSchema,
  runResumeIntelligencePipeline,
  type PipelineResult,
} from "./pipeline.server";

export type { PipelineResult } from "./pipeline.server";

// TalentOS Resume Intelligence Pipeline — orchestration-only server function.
// Runs Resume Parser → JD Intelligence → Skill Normalization → Matching →
// Evidence. Future services are appended in pipeline.server.ts, not here.
export const runResumeIntelligence = createServerFn({ method: "POST" })
  .validator((data: unknown) => PipelineInputSchema.parse(data))
  .handler(async ({ data }): Promise<PipelineResult> => {
    return runResumeIntelligencePipeline(data);
  });
