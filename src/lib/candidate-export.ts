import type { CandidateRecord } from "./candidate-schemas";
import { candidateFieldValue } from "./candidate-schemas";
import type { ClientTemplate, TemplateColumn } from "./templates/template-types";

function resolveCellValue(record: CandidateRecord, col: TemplateColumn): string {
  if (col.hidden) return "";
  if (col.fieldKey.startsWith("__")) return col.defaultValue ?? "";
  const value = candidateFieldValue(record, col.fieldKey);
  return value || col.defaultValue || "";
}

export interface PreviewRow {
  columnId: string;
  label: string;
  value: string;
}

export function buildPreviewRow(record: CandidateRecord, template: ClientTemplate): PreviewRow[] {
  return template.columns
    .filter((c) => !c.hidden)
    .map((c) => ({
      columnId: c.id,
      label: c.label,
      value: resolveCellValue(record, c),
    }));
}

function slug(v: string): string {
  return (v || "candidate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "candidate";
}

function timestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function exportFileName(record: CandidateRecord, template: ClientTemplate, ext: "xlsx" | "csv"): string {
  const parts = record.fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0] || "candidate";
  return `candidate-${slug(last)}-${slug(template.name)}-${timestamp()}.${ext}`;
}

function toAOA(rows: PreviewRow[]): string[][] {
  return [rows.map((r) => r.label), rows.map((r) => r.value)];
}

export async function exportToXlsx(
  record: CandidateRecord,
  template: ClientTemplate,
  overrideRows?: PreviewRow[],
): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = overrideRows ?? buildPreviewRow(record, template);
  const aoa = toAOA(rows);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, template.export?.sheetName || "Candidates");
  XLSX.writeFile(wb, exportFileName(record, template, "xlsx"));
}

export async function exportToCsv(
  record: CandidateRecord,
  template: ClientTemplate,
  overrideRows?: PreviewRow[],
): Promise<void> {
  const rows = overrideRows ?? buildPreviewRow(record, template);
  const escape = (s: string) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [rows.map((r) => escape(r.label)).join(","), rows.map((r) => escape(r.value)).join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName(record, template, "csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}