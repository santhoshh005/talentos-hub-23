import { z } from "zod";

const EmploymentEntrySchema = z.object({
  company: z.string().default(""),
  title: z.string().default(""),
  start: z.string().default(""),
  end: z.string().default(""),
  isCurrent: z.boolean().default(false),
});
export type EmploymentEntry = z.infer<typeof EmploymentEntrySchema>;

const EducationEntrySchema = z.object({
  degree: z.string().default(""),
  institution: z.string().default(""),
  year: z.string().default(""),
});
export type EducationEntry = z.infer<typeof EducationEntrySchema>;

export const CandidateRecordSchema = z.object({
  // Identity
  fullName: z.string().default(""),
  headline: z.string().default(""),
  summary: z.string().default(""),
  // Contact
  email: z.string().default(""),
  mobile: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  portfolio: z.string().default(""),
  // Current employment
  currentCompany: z.string().default(""),
  currentDesignation: z.string().default(""),
  employmentType: z.string().default(""),
  // Previous employment
  previousEmployment: z.array(EmploymentEntrySchema).default([]),
  // Experience
  totalExperience: z.string().default(""),
  relevantExperience: z.string().default(""),
  // Skills
  primarySkills: z.array(z.string()).default([]),
  secondarySkills: z.array(z.string()).default([]),
  // Location
  currentLocation: z.string().default(""),
  preferredLocation: z.string().default(""),
  // Compensation
  currentCTC: z.string().default(""),
  expectedCTC: z.string().default(""),
  noticePeriod: z.string().default(""),
  currentOffer: z.string().default(""),
  reasonForChange: z.string().default(""),
  // Education & Certifications
  education: z.array(EducationEntrySchema).default([]),
  certifications: z.array(z.string()).default([]),
  // Documents
  pan: z.string().default(""),
  passport: z.string().default(""),
  visaStatus: z.string().default(""),
  // Recruiter notes
  recruiterNotes: z.string().default(""),
});
export type CandidateRecord = z.infer<typeof CandidateRecordSchema>;

export const emptyCandidateRecord = (): CandidateRecord => CandidateRecordSchema.parse({});

// Field registry used by templates + export + completeness.
type CandidateFieldKey = keyof CandidateRecord | "recruiterNotes";

export interface CandidateFieldMeta {
  key: string;
  label: string;
  group:
    | "Identity"
    | "Contact"
    | "Employment"
    | "Experience"
    | "Skills"
    | "Location"
    | "Compensation"
    | "Education"
    | "Documents"
    | "Notes";
  scalar: boolean;
}

export const CANDIDATE_FIELDS: readonly CandidateFieldMeta[] = [
  { key: "fullName", label: "Candidate Name", group: "Identity", scalar: true },
  { key: "headline", label: "Headline", group: "Identity", scalar: true },
  { key: "summary", label: "Professional Summary", group: "Identity", scalar: true },
  { key: "email", label: "Email", group: "Contact", scalar: true },
  { key: "mobile", label: "Mobile", group: "Contact", scalar: true },
  { key: "linkedin", label: "LinkedIn", group: "Contact", scalar: true },
  { key: "github", label: "GitHub", group: "Contact", scalar: true },
  { key: "portfolio", label: "Portfolio", group: "Contact", scalar: true },
  { key: "currentCompany", label: "Current Company", group: "Employment", scalar: true },
  { key: "currentDesignation", label: "Current Designation", group: "Employment", scalar: true },
  { key: "employmentType", label: "Employment Type", group: "Employment", scalar: true },
  { key: "previousEmployment", label: "Previous Companies", group: "Employment", scalar: false },
  { key: "totalExperience", label: "Total Experience", group: "Experience", scalar: true },
  { key: "relevantExperience", label: "Relevant Experience", group: "Experience", scalar: true },
  { key: "primarySkills", label: "Primary Skills", group: "Skills", scalar: false },
  { key: "secondarySkills", label: "Secondary Skills", group: "Skills", scalar: false },
  { key: "currentLocation", label: "Current Location", group: "Location", scalar: true },
  { key: "preferredLocation", label: "Preferred Location", group: "Location", scalar: true },
  { key: "currentCTC", label: "Current CTC", group: "Compensation", scalar: true },
  { key: "expectedCTC", label: "Expected CTC", group: "Compensation", scalar: true },
  { key: "noticePeriod", label: "Notice Period", group: "Compensation", scalar: true },
  { key: "currentOffer", label: "Current Offer", group: "Compensation", scalar: true },
  { key: "reasonForChange", label: "Reason for Change", group: "Compensation", scalar: true },
  { key: "education", label: "Education", group: "Education", scalar: false },
  { key: "certifications", label: "Certifications", group: "Education", scalar: false },
  { key: "pan", label: "PAN", group: "Documents", scalar: true },
  { key: "passport", label: "Passport", group: "Documents", scalar: true },
  { key: "visaStatus", label: "Visa Status", group: "Documents", scalar: true },
  { key: "recruiterNotes", label: "Recruiter Notes", group: "Notes", scalar: true },
] as const;

// Fields tracked by the completeness meter (core recruiter must-haves).
const COMPLETENESS_KEYS: readonly string[] = [
  "fullName",
  "email",
  "mobile",
  "currentCompany",
  "currentDesignation",
  "totalExperience",
  "primarySkills",
  "currentLocation",
  "currentCTC",
  "expectedCTC",
  "noticePeriod",
  "linkedin",
  "education",
];

export function candidateFieldValue(record: CandidateRecord, key: string): string {
  const v = (record as unknown as Record<string, unknown>)[key];
  if (Array.isArray(v)) {
    if (v.length === 0) return "";
    if (typeof v[0] === "string") return (v as string[]).join(", ");
    // employment / education arrays → compact string
    if (key === "previousEmployment") {
      return (v as EmploymentEntry[])
        .map((e) => [e.title, e.company].filter(Boolean).join(" @ "))
        .filter(Boolean)
        .join(" | ");
    }
    if (key === "education") {
      return (v as EducationEntry[])
        .map((e) => [e.degree, e.institution, e.year].filter(Boolean).join(" — "))
        .filter(Boolean)
        .join(" | ");
    }
    return v.map((x) => String(x)).join(", ");
  }
  return v == null ? "" : String(v);
}

export function candidateCompleteness(record: CandidateRecord): {
  percent: number;
  missing: string[];
} {
  const missing: string[] = [];
  for (const key of COMPLETENESS_KEYS) {
    const value = candidateFieldValue(record, key);
    if (!value || value.trim().length === 0) {
      const meta = CANDIDATE_FIELDS.find((f) => f.key === key);
      missing.push(meta?.label ?? key);
    }
  }
  const filled = COMPLETENESS_KEYS.length - missing.length;
  return {
    percent: Math.round((filled / COMPLETENESS_KEYS.length) * 100),
    missing,
  };
}
