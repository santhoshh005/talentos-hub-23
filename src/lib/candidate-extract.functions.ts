import { createServerFn } from "@tanstack/react-start";
import { CandidateExtractInputSchema, runExtractCandidate } from "./candidate-extract.server";
import type { CandidateRecord } from "./candidate-schemas";

export type { CandidateRecord };

export const extractCandidateRecord = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CandidateExtractInputSchema.parse(data))
  .handler(async ({ data }): Promise<CandidateRecord> => {
    return runExtractCandidate(data.resumeText, data.seed as Partial<CandidateRecord> | undefined);
  });
