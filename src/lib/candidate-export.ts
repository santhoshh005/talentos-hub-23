import type { CandidateRecord } from "./candidate-schemas";
import { candidateFieldValue } from "./candidate-schemas";
import type { ClientTemplate, TemplateColumn } from "./templates/template-types";
import { DEFAULT_HEADER_COLOR, DEFAULT_HEADER_TEXT_COLOR } from "./templates/template-types";

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

function normalizeHex(input: string | undefined, fallback: string): string {
  const raw = (input ?? "").trim();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  return fallback.replace("#", "").toUpperCase();
}

function headerStyle(template: ClientTemplate, headerColorOverride?: string) {
  const fill = normalizeHex(headerColorOverride ?? template.headerColor, DEFAULT_HEADER_COLOR);
  const font = normalizeHex(template.headerTextColor, DEFAULT_HEADER_TEXT_COLOR);
  return {
    fill: { patternType: "solid" as const, fgColor: { rgb: fill } },
    font: { bold: true, color: { rgb: font } },
    alignment: { vertical: "center" as const, horizontal: "left" as const, wrapText: true },
  };
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

async function loadXlsx() {
  const mod = await import("xlsx-js-style");
  return (mod as unknown as { default?: typeof mod }).default ?? mod;
}

export async function exportToXlsx(
  record: CandidateRecord,
  template: ClientTemplate,
  overrideRows?: PreviewRow[],
  headerColorOverride?: string,
): Promise<void> {
  const XLSX = await loadXlsx();
  const rows = overrideRows ?? buildPreviewRow(record, template);
  const aoa = toAOA(rows);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  applyHeaderStyle(XLSX, sheet, rows.length, template, headerColorOverride);
  sheet["!cols"] = rows.map((r) => ({ wch: Math.min(40, Math.max(14, r.label.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, template.export?.sheetName || "Candidates");
  XLSX.writeFile(wb, exportFileName(record, template, "xlsx"));
}

function applyHeaderStyle(
  XLSX: Awaited<ReturnType<typeof loadXlsx>>,
  sheet: Record<string, { s?: unknown } | undefined>,
  columnCount: number,
  template: ClientTemplate,
  headerColorOverride?: string,
) {
  const style = headerStyle(template, headerColorOverride);
  for (let c = 0; c < columnCount; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const cell = sheet[addr];
    if (cell) cell.s = style;
  }
}

/**
 * Export multiple candidate records into one .xlsx using the given template.
 * Header row uses the template's chosen header color.
 */
export async function exportBulkXlsx(
  records: CandidateRecord[],
  template: ClientTemplate,
  overrideRowsPerRecord?: PreviewRow[][],
  headerColorOverride?: string,
): Promise<void> {
  const XLSX = await loadXlsx();
  const perRecord = overrideRowsPerRecord ?? records.map((r) => buildPreviewRow(r, template));
  const first = perRecord[0] ?? buildPreviewRow(records[0] ?? ({} as CandidateRecord), template);
  const header = first.map((r) => r.label);
  const dataRows = perRecord.map((row) => row.map((c) => c.value));
  const aoa: string[][] = [header, ...dataRows];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  applyHeaderStyle(XLSX, sheet, header.length, template, headerColorOverride);
  sheet["!cols"] = header.map((h, i) => {
    const maxLen = Math.max(h.length, ...dataRows.map((r) => (r[i] ?? "").length));
    return { wch: Math.min(48, Math.max(14, maxLen + 2)) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, template.export?.sheetName || "Candidates");
  const name = `candidates-${slug(template.name)}-${records.length}-${timestamp()}.xlsx`;
  XLSX.writeFile(wb, name);
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