import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateJdContent, generateJdFromResume } from "./jd-studio.server";

const JDStudioInputSchema = z.object({
  positionTitle: z.string().min(2, "Position title is required"),
  department: z.string().default(""),
  level: z.string().default(""),
  location: z.string().min(2, "Location is required"),
  employmentType: z.string().default(""),
  requiredExperience: z.string().min(1, "Experience is required"),
  roleDescription: z.string().min(10, "Role description is required"),
  mustHaveSkills: z.string().min(1, "Must-have skills are required"),
  tone: z.string().default("Clear & professional"),
});

export const runJDStudioGeneration = createServerFn({ method: "POST" })
  .validator((data: unknown) => JDStudioInputSchema.parse(data))
  .handler(async ({ data }) => {
    return generateJdContent(data);
  });

export const runJDFromResumeGeneration = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        resumeText: z.string(),
        tone: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<string> => {
    return generateJdFromResume(data.resumeText, data.tone);
  });
