import { createServerFn } from "@tanstack/react-start";
import {
  InputSchema,
  ParseInputSchema,
  runAnalyzeResumeMatch,
  runParseResume,
  type ParsedResumeData,
  type ResumeAnalysis,
} from "./resume-analyzer.server";

export type { ParsedResumeData, ResumeAnalysis };

export const analyzeResumeMatch = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<ResumeAnalysis> => {
    return runAnalyzeResumeMatch(data);
  });

export const parseResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ParseInputSchema.parse(data))
  .handler(async ({ data }): Promise<ParsedResumeData> => {
    return runParseResume(data);
  });