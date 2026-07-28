import { createServerFn } from "@tanstack/react-start";
import {
  JdParseInputSchema,
  runParseJobDescription,
  type ParsedJobDescription,
} from "./jd-parser.server";

export type { ParsedJobDescription };

export const parseJobDescription = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => JdParseInputSchema.parse(data))
  .handler(async ({ data }): Promise<ParsedJobDescription> => {
    return runParseJobDescription(data);
  });