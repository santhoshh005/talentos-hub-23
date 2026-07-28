import { CANDIDATE_FIELDS } from "../candidate-schemas";
import { DEFAULT_MISMATCH_RULE_SET, normalizeMismatchRuleSet, type MismatchRuleSetId, type TemplateColumn } from "./template-types";
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

export function diagnoseColumn(
  column: Pick<TemplateColumn, "fieldKey" | "label">,
  ruleSet: MismatchRuleSetId | undefined = DEFAULT_MISMATCH_RULE_SET,
): ColumnDiagnostic {
  const normalizedRuleSet = normalizeMismatchRuleSet(ruleSet);
  if (normalizedRuleSet === "trust-template") {
    return {
      sourceCaption: describeField(column.fieldKey),
      mismatch: false,
    };
  }
  const suggestedKey = suggestFieldKeyForLabel(column.label, normalizedRuleSet);
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

export function countMismatches(
  columns: ReadonlyArray<Pick<TemplateColumn, "fieldKey" | "label">>,
  ruleSet: MismatchRuleSetId | undefined = DEFAULT_MISMATCH_RULE_SET,
): number {
  let n = 0;
  for (const c of columns) if (diagnoseColumn(c, ruleSet).mismatch) n++;
  return n;
}

/**
 * Apply the suggested Map-chip remap to every mismatched column.
 * Preserves labels — only rewrites `fieldKey` where a confident suggestion exists.
 */
export function applyColumnFixes<T extends Pick<TemplateColumn, "fieldKey" | "label">>(
  columns: ReadonlyArray<T>,
  ruleSet: MismatchRuleSetId | undefined = DEFAULT_MISMATCH_RULE_SET,
): { columns: T[]; fixed: number } {
  let fixed = 0;
  const next = columns.map((c) => {
    const d = diagnoseColumn(c, ruleSet);
    if (d.mismatch && d.suggestedKey) {
      fixed++;
      return { ...c, fieldKey: d.suggestedKey };
    }
    return { ...c };
  });
  return { columns: next, fixed };
}