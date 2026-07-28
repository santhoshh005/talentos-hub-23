import { candidateFieldValue, type CandidateRecord } from "./candidate-schemas";

export interface DefaultHeader {
  id: string;
  label: string;
  fieldKey?: keyof CandidateRecord | string; // undefined = manual/custom column
}

// Fixed recruiter header set requested by the user.
export const DEFAULT_HEADERS: readonly DefaultHeader[] = [
  { id: "name", label: "Name", fieldKey: "fullName" },
  { id: "mobile", label: "Contact Number", fieldKey: "mobile" },
  { id: "email", label: "Email ID", fieldKey: "email" },
  { id: "totalExperience", label: "Total Experience", fieldKey: "totalExperience" },
  { id: "relevantExperience", label: "Relevant Exp", fieldKey: "relevantExperience" },
  { id: "vendor", label: "Vendor" },
  { id: "ctc", label: "CTC", fieldKey: "currentCTC" },
  { id: "ectc", label: "ECTC", fieldKey: "expectedCTC" },
  { id: "location", label: "Location", fieldKey: "currentLocation" },
  { id: "np", label: "NP", fieldKey: "noticePeriod" },
  { id: "skills", label: "Skills", fieldKey: "primarySkills" },
  { id: "currentCompany", label: "Current Company", fieldKey: "currentCompany" },
  { id: "client", label: "Client" },
  { id: "status", label: "Status" },
  { id: "remarks", label: "Remarks", fieldKey: "recruiterNotes" },
] as const;

export interface DefaultRow {
  columnId: string;
  label: string;
  value: string;
}

export function buildDefaultRows(record: CandidateRecord): DefaultRow[] {
  return DEFAULT_HEADERS.map((h) => ({
    columnId: h.id,
    label: h.label,
    value: h.fieldKey ? candidateFieldValue(record, h.fieldKey as string) : "",
  }));
}