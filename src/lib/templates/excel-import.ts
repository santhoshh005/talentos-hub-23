import { CANDIDATE_FIELDS } from "../candidate-schemas";
import type { MismatchRuleSetId, TemplateColumn } from "./template-types";

export async function parseTemplateHeaders(file: File): Promise<string[]> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const sheet = wb.Sheets[first];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
  const header = rows[0] ?? [];
  return header.map((h) => String(h ?? "").trim()).filter(Boolean);
}

const HEADER_LABEL_HINTS: Record<string, string[]> = {
  fullName: ["name", "candidate", "full name"],
  email: ["email", "e-mail", "mail"],
  mobile: ["mobile", "phone", "contact", "cell"],
  linkedin: ["linkedin", "linked in"],
  github: ["github", "git"],
  portfolio: ["portfolio", "website"],
  currentCompany: ["current company", "employer", "company"],
  currentDesignation: ["designation", "title", "role"],
  totalExperience: ["total experience", "experience", "exp", "years"],
  relevantExperience: ["relevant experience", "relevant"],
  primarySkills: ["skill", "primary", "tech", "stack"],
  secondarySkills: ["secondary"],
  currentLocation: ["current location", "location", "based"],
  preferredLocation: ["preferred location", "preferred"],
  currentCTC: ["current ctc", "current salary", "ctc"],
  expectedCTC: ["expected ctc", "expected salary", "expected"],
  noticePeriod: ["notice", "np"],
  employmentType: ["employment type", "type"],
  education: ["education", "qualification"],
  certifications: ["cert"],
  pan: ["pan"],
  passport: ["passport"],
  visaStatus: ["visa"],
  recruiterNotes: ["remarks", "notes", "comment"],
};

const CONSERVATIVE_CLIENT_HINTS: Record<string, string[]> = {
  fullName: ["candidate name", "full name", "name of candidate"],
  email: ["email", "email id", "e-mail", "mail id"],
  mobile: ["mobile", "mobile number", "phone number", "contact number", "phone no", "ph no"],
  linkedin: ["linkedin", "linked in"],
  github: ["github"],
  portfolio: ["portfolio", "website"],
  currentCompany: ["current company", "current employer", "current organisation", "current organization"],
  currentDesignation: ["current designation", "designation", "job title", "current role"],
  totalExperience: ["total experience", "total exp", "overall experience"],
  relevantExperience: ["relevant experience"],
  primarySkills: ["primary skills", "technical skills", "key skills", "skills"],
  secondarySkills: ["secondary skills"],
  currentLocation: ["current location"],
  preferredLocation: ["preferred location"],
  currentCTC: ["current ctc", "current salary"],
  expectedCTC: ["expected ctc", "expected salary"],
  noticePeriod: ["notice period", "notice", "np"],
  employmentType: ["employment type"],
  education: ["education", "qualification"],
  certifications: ["certification", "certifications"],
  pan: ["pan", "pan number"],
  passport: ["passport", "passport number"],
  visaStatus: ["visa status"],
  recruiterNotes: ["remarks", "notes", "comments", "recruiter notes"],
};

function hintsForRuleSet(ruleSet: MismatchRuleSetId | undefined): Record<string, string[]> {
  if (ruleSet === "conservative-client") return CONSERVATIVE_CLIENT_HINTS;
  return HEADER_LABEL_HINTS;
}

/**
 * Best-effort mapping from a human header label to a candidate fieldKey.
 * Returns undefined when nothing plausible matches. Longer hints win so
 * "current ctc" beats "ctc" and "current location" beats "location".
 */
export function suggestFieldKeyForLabel(label: string, ruleSet?: MismatchRuleSetId): string | undefined {
  const lower = label.toLowerCase().trim();
  if (!lower) return undefined;
  let best: { key: string; score: number } | undefined;
  for (const [key, hints] of Object.entries(hintsForRuleSet(ruleSet))) {
    for (const hint of hints) {
      if (lower.includes(hint) && (!best || hint.length > best.score)) {
        best = { key, score: hint.length };
      }
    }
  }
  if (!best) return undefined;
  if (best.key === "recruiterNotes") return best.key;
  return CANDIDATE_FIELDS.some((f) => f.key === best!.key) ? best.key : undefined;
}

export function suggestFieldMapping(headers: string[]): TemplateColumn[] {
  return headers.map((header, i) => {
    const match = suggestFieldKeyForLabel(header, "header-label");
    return {
      id: `imp_${i}_${Math.random().toString(36).slice(2, 7)}`,
      fieldKey: match ?? `__unmapped_${i}`,
      label: header,
    };
  });
}