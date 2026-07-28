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
}

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