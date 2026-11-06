import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth-middleware";
import {
  PipelineInputSchema,
  runResumeIntelligencePipeline,
  type PipelineResult,
} from "./pipeline.server";

export type { PipelineResult } from "./pipeline.server";

// TalentOS Resume Intelligence Pipeline — orchestration-only server function.
// Requires a signed-in user with remaining quota; usage is recorded on the
// server after a successful run so it cannot be skipped by the client.
export const runResumeIntelligence = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => PipelineInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<PipelineResult> => {
    const { assertUsageAvailable, recordUsageSafely } = await import("./admin.server");
    assertUsageAvailable(context.profile);
    const result = await runResumeIntelligencePipeline(data);
    if (result.ok) {
      await recordUsageSafely(context.profile.id, "analysis", {
        score: result.scoring.matchPercentage,
        title: (result.jobDescription.jobTitle ?? "").slice(0, 120),
        techs: (result.resume.technologies ?? []).slice(0, 15),
      });
    }
    return result;
  });
