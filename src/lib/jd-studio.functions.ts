import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "./auth-middleware";
import { generateJdContent, generateJdFromResume } from "./jd-studio.server";
import type { Profile } from "./supabase-types";

const short = (max: number) => z.string().trim().max(max);

const JDStudioInputSchema = z.object({
  positionTitle: short(120).pipe(z.string().min(2, "Position title is required")),
  department: short(120).default(""),
  level: short(60).default(""),
  location: short(120).pipe(z.string().min(2, "Location is required")),
  employmentType: short(60).default(""),
  requiredExperience: short(60).pipe(z.string().min(1, "Experience is required")),
  roleDescription: short(4000).pipe(z.string().min(10, "Role description is required")),
  mustHaveSkills: short(1500).pipe(z.string().min(1, "Must-have skills are required")),
  tone: short(80).default("Clear & professional"),
});

const JDFromResumeInputSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(50, "Resume text is too short to generate a JD")
    .max(60_000, "Resume is too long"),
  tone: short(80).default("Clear & professional"),
});

async function guard(profile: Profile, title: string) {
  const { assertUsageAvailable, recordUsageSafely } = await import("./admin.server");
  assertUsageAvailable(profile);
  return () => recordUsageSafely(profile.id, "jd_generation", { title: title.slice(0, 120) });
}

export const runJDStudioGeneration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => JDStudioInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<string> => {
    const record = await guard(context.profile, data.positionTitle);
    const jd = await generateJdContent(data);
    await record();
    return jd;
  });

export const runJDFromResumeGeneration = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => JDFromResumeInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<string> => {
    const record = await guard(context.profile, "From resume");
    const jd = await generateJdFromResume(data.resumeText, data.tone);
    await record();
    return jd;
  });
