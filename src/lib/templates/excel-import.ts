import { CANDIDATE_FIELDS } from "../candidate-schemas";
import type { TemplateColumn } from "./template-types";

const MAX_TEMPLATE_BYTES = 5 * 1024 * 1024;
const MAX_HEADER_COLUMNS = 200;
const MAX_HEADER_LENGTH = 120;

/**
 * Reads only the header row of the first sheet. The parser is restricted
 * (first sheet, one row, no formulas/HTML/styles/VBA) and the file is
 * size-checked to limit exposure to malformed-workbook parser bugs.
 */
export async function parseTemplateHeaders(file: File): Promise<string[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Please upload an .xlsx file.");
  if (file.size > MAX_TEMPLATE_BYTES) throw new Error("Template file must be under 5 MB.");

  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, {
    type: "array",
    sheets: 0,
    sheetRows: 1,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    bookVBA: false,
  });
  const first = wb.SheetNames[0];
  if (!first) return [];
  const sheet = wb.Sheets[first];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const header = Array.isArray(rows[0]) ? rows[0] : [];
  return header
    .slice(0, MAX_HEADER_COLUMNS)
    .map((h) =>
      String(h ?? "")
        .trim()
        .slice(0, MAX_HEADER_LENGTH),
    )
    .filter(Boolean);
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
