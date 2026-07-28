export interface TemplateColumn {
  id: string;
  fieldKey: string; // matches CANDIDATE_FIELDS[].key, or a custom key
  label: string;    // recruiter-facing label (may differ from field label)
  defaultValue?: string;
  hidden?: boolean;
}

export interface ExportSettings {
  sheetName: string;
}

export type MismatchRuleSetId = "trust-template" | "header-label" | "conservative-client";

export interface MismatchRuleSetOption {
  id: MismatchRuleSetId;
  label: string;
  description: string;
}

export const DEFAULT_MISMATCH_RULE_SET: MismatchRuleSetId = "trust-template";

export const MISMATCH_RULE_SETS: readonly MismatchRuleSetOption[] = [
  {
    id: "trust-template",
    label: "Trust saved mapping",
    description: "Use this client's saved field selectors and suppress label-only mismatch warnings.",
  },
  {
    id: "header-label",
    label: "Auto-map by headers",
    description: "Uses the column header text to review field mappings aggressively.",
  },
  {
    id: "conservative-client",
    label: "Conservative client headers",
    description: "Uses exact, low-risk header matches for clients with custom labels.",
  },
] as const;

export function normalizeMismatchRuleSet(value: string | undefined): MismatchRuleSetId {
  return MISMATCH_RULE_SETS.some((r) => r.id === value)
    ? (value as MismatchRuleSetId)
    : DEFAULT_MISMATCH_RULE_SET;
}

export interface ClientTemplate {
  id: string;
  name: string;
  description?: string;
  columns: TemplateColumn[];
  notes?: string;
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
  export?: ExportSettings;
  /** Hex color for the header row background in the exported Excel. */
  headerColor?: string;
  /** Hex color for the header row text in the exported Excel. */
  headerTextColor?: string;
  /** Controls how mismatch diagnostics and one-click fixes behave for this client template. */
  mismatchRuleSet?: MismatchRuleSetId;
  /** Set by the migration when a column label appears to disagree with its fieldKey. */
  needsReview?: boolean;
}

export const DEFAULT_HEADER_COLOR = "#0F172A";
export const DEFAULT_HEADER_TEXT_COLOR = "#FFFFFF";

export interface TemplateSummary {
  id: string;
  name: string;
  description?: string;
  columnCount: number;
  favorite?: boolean;
  updatedAt: number;
}

export function summarize(t: ClientTemplate): TemplateSummary {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    columnCount: t.columns.length,
    favorite: t.favorite,
    updatedAt: t.updatedAt,
  };
}