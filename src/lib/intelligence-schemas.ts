// ---------------------------------------------------------------------------
// TalentOS Intelligence v3 — shared Zod schemas
// ---------------------------------------------------------------------------
// Consumed by llm-extract.server.ts and semantic-match.server.ts.
// Schemas are intentionally free of min/max/enum bounds so structured-output
// providers accept them and downstream post-processing does the clamping.
// ---------------------------------------------------------------------------

import { z } from "zod";

const SkillEntryV3Schema = z.object({
  canonical: z.string().describe("The canonical, industry-standard name of the skill (e.g., 'React.js', 'Python')"),
  aliases: z.array(z.string()).default([]).describe("Alternative names or variations found in the text (e.g., ['React', 'ReactJS'])"),
  category: z.string().default("Other").describe("A broad category for the skill (e.g., 'Frontend', 'Backend', 'Data')"),
  years: z.number().default(0).describe("Years of experience with this skill if explicitly mentioned, else 0"),
  evidence: z.array(z.string()).default([]).describe("Short excerpts from the text proving this skill"),
});
type SkillEntryV3 = z.infer<typeof SkillEntryV3Schema>;

const EmploymentEntryV3Schema = z.object({
  company: z.string(),
  title: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  isCurrent: z.boolean().default(false),
  summary: z.string().default(""),
});
type EmploymentEntryV3 = z.infer<typeof EmploymentEntryV3Schema>;

export const ParsedResumeV3Schema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  currentCompany: z.string().default(""),
  currentDesignation: z.string().default(""),
  totalYears: z.number().default(0).describe("Total years of professional experience inferred from employment history"),
  relevantYears: z.number().default(0).describe("Years of relevant experience in the candidate's primary domain"),
  noticePeriod: z.string().default("").describe("Notice period if mentioned, else empty string"),
  employment: z.array(EmploymentEntryV3Schema).default([]).describe("List of work experience/employment entries"),
  education: z.array(z.string()).default([]).describe("List of education degrees and institutions"),
  certifications: z.array(z.string()).default([]).describe("List of certifications and licenses"),
  projects: z.array(z.string()).default([]).describe("List of projects worked on, including personal and professional"),
  languages: z.array(z.string()).default([]).describe("Spoken languages"),
  skills: z.array(SkillEntryV3Schema).default([]),
  inferredDomain: z.string().default(""),
  inferredSeniority: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type ParsedResumeV3 = z.infer<typeof ParsedResumeV3Schema>;

const JdRequirementV3Schema = z.object({
  canonical: z.string().describe("The canonical, industry-standard name of the skill (e.g., 'React.js', 'Python')"),
  aliases: z.array(z.string()).default([]).describe("Alternative names or variations found in the text (e.g., ['React', 'ReactJS'])"),
  category: z.string().default("Other").describe("A broad category for the skill (e.g., 'Frontend', 'Backend', 'Data')"),
  weight: z.number().default(1).describe("Importance weight: 1 (nice to have), 2 (important), 3 (critical)"),
});
type JdRequirementV3 = z.infer<typeof JdRequirementV3Schema>;

export const ParsedJDV3Schema = z.object({
  jobTitle: z.string().default("").describe("Job title or position name"),
  domain: z.string().default("").describe("Inferred professional domain (e.g., Software Engineering, Sales)"),
  industry: z.string().default("").describe("Industry (e.g., Tech, Healthcare, Finance)"),
  department: z.string().default("").describe("Department within the company"),
  employmentType: z.string().default("").describe("Employment type (e.g., Full-time, Contract)"),
  seniorityLevel: z.string().default("").describe("Seniority level (e.g., Junior, Senior, Staff)"),
  experienceRequired: z.string().default("").describe("Raw text description of experience required"),
  minYears: z.number().default(0).describe("Minimum years of experience required"),
  maxYears: z.number().default(0).describe("Maximum years of experience required, or 0 if unstated"),
  educationRequired: z.array(z.string()).default([]).describe("Required or preferred education degrees"),
  required: z.array(JdRequirementV3Schema).default([]).describe("Mandatory hard skills and requirements"),
  preferred: z.array(JdRequirementV3Schema).default([]).describe("Nice-to-have or preferred hard skills"),
  responsibilities: z.array(z.string()).default([]).describe("List of core job responsibilities"),
  softSkills: z.array(z.string()).default([]).describe("Required soft skills (e.g., Communication, Leadership)"),
  certifications: z.array(z.string()).default([]).describe("Required or preferred certifications/licenses"),
});
export type ParsedJDV3 = z.infer<typeof ParsedJDV3Schema>;

type SemanticMatchStatus = "exact" | "equivalent" | "related" | "missing";

const SemanticMatchEntrySchema = z.object({
  requirement: z.string().describe("The JD requirement being evaluated"),
  status: z.enum(["exact", "equivalent", "related", "missing"]).describe("Match status based on rules"),
  matchedResumeSkill: z.string().default("").describe("The skill from the resume that matched, if any"),
  confidence: z.number().default(0).describe("Confidence score: 100 for exact, 95 for equivalent, 80 for related, 0 for missing"),
  reason: z.string().default("").describe("Brief reason for this match classification"),
});
export type SemanticMatchEntry = z.infer<typeof SemanticMatchEntrySchema>;

export const SemanticMatchV3Schema = z.object({
  matches: z.array(SemanticMatchEntrySchema).default([]),
});
export type SemanticMatchV3 = z.infer<typeof SemanticMatchV3Schema>;
