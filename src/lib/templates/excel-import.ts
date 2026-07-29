import { CANDIDATE_FIELDS } from "../candidate-schemas";
import type { TemplateColumn } from "./template-types";

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

const HINTS: Record<string, string[]> = {
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

export function suggestFieldMapping(headers: string[]): TemplateColumn[] {
  return headers.map((header, i) => {
    const lower = header.toLowerCase();
    let match: string | undefined;
    for (const [key, hints] of Object.entries(HINTS)) {
      if (hints.some((h) => lower.includes(h))) {
        match = key;
        break;
      }
    }
    // Verify match is a real field
    if (match && !CANDIDATE_FIELDS.some((f) => f.key === match) && match !== "recruiterNotes") {
      match = undefined;
    }
    return {
      id: `imp_${i}_${Math.random().toString(36).slice(2, 7)}`,
      fieldKey: match ?? `__unmapped_${i}`,
      label: header,
    };
  });
}
