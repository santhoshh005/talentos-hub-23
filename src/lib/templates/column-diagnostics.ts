import { CANDIDATE_FIELDS } from "../candidate-schemas";
import type { TemplateColumn } from "./template-types";
import { suggestFieldKeyForLabel } from "./excel-import";

export interface ColumnDiagnostic {
  /** "Group · Label" caption describing the source field, or a fallback for custom/unmapped. */
  sourceCaption: string;
  /** Suggested fieldKey based on the label — undefined when nothing plausible matches. */
  suggestedKey?: string;
  /** Human label for the suggested field. */
  suggestedLabel?: string;
  /** True when the current fieldKey clearly disagrees with the label. */
  mismatch: boolean;
}

export function describeField(fieldKey: string): string {
  if (!fieldKey || fieldKey.startsWith("__")) return "Custom column (no field)";
  const meta = CANDIDATE_FIELDS.find((f) => f.key === fieldKey);
  return meta ? `${meta.group} · ${meta.label}` : "Unmapped";
}

export function diagnoseColumn(column: Pick<TemplateColumn, "fieldKey" | "label">): ColumnDiagnostic {
  const suggestedKey = suggestFieldKeyForLabel(column.label);
  const suggestedMeta = suggestedKey ? CANDIDATE_FIELDS.find((f) => f.key === suggestedKey) : undefined;
  const isCustom = !column.fieldKey || column.fieldKey.startsWith("__");
  const mismatch = Boolean(
    suggestedKey && !isCustom && suggestedKey !== column.fieldKey,
  );
  return {
    sourceCaption: describeField(column.fieldKey),
    suggestedKey,
    suggestedLabel: suggestedMeta?.label ?? (suggestedKey === "recruiterNotes" ? "Recruiter Notes" : undefined),
    mismatch,
  };
}

export function countMismatches(columns: ReadonlyArray<Pick<TemplateColumn, "fieldKey" | "label">>): number {
  let n = 0;
  for (const c of columns) if (diagnoseColumn(c).mismatch) n++;
  return n;
}