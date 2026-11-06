import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth-middleware";
import { CandidateExtractInputSchema, runExtractCandidate } from "./candidate-extract.server";
import type { CandidateRecord } from "./candidate-schemas";

export type { CandidateRecord };

export const extractCandidateRecord = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => CandidateExtractInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<CandidateRecord> => {
    const { assertUsageAvailable } = await import("./admin.server");
    assertUsageAvailable(context.profile);
    return runExtractCandidate(data.resumeText, data.seed as Partial<CandidateRecord> | undefined);
  });
