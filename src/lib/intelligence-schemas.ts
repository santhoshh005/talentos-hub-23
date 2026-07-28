// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — shared Zod schemas
// ---------------------------------------------------------------------------
// Consumed by llm-extract.server.ts and semantic-match.server.ts.
// Schemas are intentionally free of min/max/enum bounds so structured-output
// providers accept them and downstream post-processing does the clamping.
// ---------------------------------------------------------------------------

import { z } from "zod";

export const SkillEntryV3Schema = z.object({
  canonical: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.string().default("Other"),
  years: z.number().default(0),
  evidence: z.array(z.string()).default([]),
});
export type SkillEntryV3 = z.infer<typeof SkillEntryV3Schema>;

export const EmploymentEntryV3Schema = z.object({
  company: z.string(),
  title: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  isCurrent: z.boolean().default(false),
  summary: z.string().default(""),
});
export type EmploymentEntryV3 = z.infer<typeof EmploymentEntryV3Schema>;

export const ParsedResumeV3Schema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  currentCompany: z.string().default(""),
  currentDesignation: z.string().default(""),
  totalYears: z.number().default(0),
  noticePeriod: z.string().default(""),
  employment: z.array(EmploymentEntryV3Schema).default([]),
  education: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  skills: z.array(SkillEntryV3Schema).default([]),
  inferredDomain: z.string().default(""),
  inferredSeniority: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type ParsedResumeV3 = z.infer<typeof ParsedResumeV3Schema>;

export const JdRequirementV3Schema = z.object({
  canonical: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.string().default("Other"),
  weight: z.number().default(1),
});
export type JdRequirementV3 = z.infer<typeof JdRequirementV3Schema>;

export const ParsedJDV3Schema = z.object({
  jobTitle: z.string().default(""),
  domain: z.string().default(""),
  industry: z.string().default(""),
  department: z.string().default(""),
  employmentType: z.string().default(""),
  seniorityLevel: z.string().default(""),
  experienceRequired: z.string().default(""),
  minYears: z.number().default(0),
  maxYears: z.number().default(0),
  educationRequired: z.array(z.string()).default([]),
  required: z.array(JdRequirementV3Schema).default([]),
  preferred: z.array(JdRequirementV3Schema).default([]),
  responsibilities: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
});
export type ParsedJDV3 = z.infer<typeof ParsedJDV3Schema>;

export type SemanticMatchStatus = "exact" | "equivalent" | "related" | "missing";

export const SemanticMatchEntrySchema = z.object({
  requirement: z.string(),
  status: z.string(),
  matchedResumeSkill: z.string().default(""),
  confidence: z.number().default(0),
  reason: z.string().default(""),
});
export type SemanticMatchEntry = z.infer<typeof SemanticMatchEntrySchema>;

export const SemanticMatchV3Schema = z.object({
  matches: z.array(SemanticMatchEntrySchema).default([]),
});
export type SemanticMatchV3 = z.infer<typeof SemanticMatchV3Schema>;