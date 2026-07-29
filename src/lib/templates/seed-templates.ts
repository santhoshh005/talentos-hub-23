import type { ClientTemplate, TemplateColumn } from "./template-types";
import { CANDIDATE_FIELDS } from "../candidate-schemas";

function col(fieldKey: string, label?: string, defaultValue?: string): TemplateColumn {
  const meta = CANDIDATE_FIELDS.find((f) => f.key === fieldKey);
  return {
    id: `col_${fieldKey}_${Math.random().toString(36).slice(2, 7)}`,
    fieldKey,
    label: label ?? meta?.label ?? fieldKey,
    defaultValue,
  };
}

function template(
  id: string,
  name: string,
  description: string,
  columns: TemplateColumn[],
): ClientTemplate {
  const now = Date.now();
  return {
    id,
    name,
    description,
    columns,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    export: { sheetName: "Candidates" },
  };
}

export function seedTemplates(): ClientTemplate[] {
  return [
    template(
      "tpl_seed_a",
      "Template A · Standard Submission",
      "Core candidate fields for a fast client submission.",
      [
        col("fullName", "Candidate Name"),
        col("mobile", "Mobile"),
        col("email", "Email"),
        col("primarySkills", "Skill"),
        col("totalExperience", "Experience"),
        col("noticePeriod", "Notice Period"),
      ],
    ),
    template(
      "tpl_seed_b",
      "Template B · Compensation Tracker",
      "Ideal for vendor / assessment pipelines with CTC visibility.",
      [
        col("fullName", "Candidate Name"),
        col("currentCompany", "Current Company"),
        col("currentCTC", "Current CTC"),
        col("expectedCTC", "Expected CTC"),
        {
          id: `col_vendor_${Math.random().toString(36).slice(2, 7)}`,
          fieldKey: "__custom_vendor",
          label: "Vendor",
          defaultValue: "",
        },
        {
          id: `col_assessment_${Math.random().toString(36).slice(2, 7)}`,
          fieldKey: "__custom_assessment",
          label: "Assessment",
          defaultValue: "",
        },
        {
          id: `col_remarks_${Math.random().toString(36).slice(2, 7)}`,
          fieldKey: "recruiterNotes",
          label: "Remarks",
        },
      ],
    ),
    template(
      "tpl_seed_c",
      "Template C · Location & Status",
      "Skill + location match with recruiter status column.",
      [
        col("fullName", "Candidate Name"),
        col("primarySkills", "Skill"),
        col("currentLocation", "Current Location"),
        col("preferredLocation", "Preferred Location"),
        {
          id: `col_comm_${Math.random().toString(36).slice(2, 7)}`,
          fieldKey: "__custom_communication",
          label: "Communication",
          defaultValue: "",
        },
        {
          id: `col_status_${Math.random().toString(36).slice(2, 7)}`,
          fieldKey: "__custom_status",
          label: "Status",
          defaultValue: "",
        },
      ],
    ),
  ];
}
