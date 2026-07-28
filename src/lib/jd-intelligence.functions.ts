import { createServerFn } from "@tanstack/react-start";
import {
  JdIntelligenceInputSchema,
  runJdIntelligence,
  type JdIntelligence,
} from "./jd-intelligence.server";

export type { JdIntelligence };

// JD Intelligence Engine — structures a Job Description only.
// Never compares against resumes and never produces scores or interview content.
export const analyzeJobDescription = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => JdIntelligenceInputSchema.parse(data))
  .handler(async ({ data }): Promise<JdIntelligence> => {
    return runJdIntelligence(data);
  });