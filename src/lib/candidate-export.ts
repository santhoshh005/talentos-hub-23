import type { CandidateRecord } from "./candidate-schemas";

export interface PreviewRow {
  columnId: string;
  label: string;
  value: string;
}

function slug(v: string): string {
  return (
    (v || "candidate")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "candidate"
  );
}

function timestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function exportFileName(record: CandidateRecord, ext: "xlsx" | "csv"): string {
  const parts = record.fullName.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0] || "candidate";
  return `candidate-${slug(last)}-${timestamp()}.${ext}`;
}

function toAOA(rows: PreviewRow[]): string[][] {
  return [rows.map((r) => r.label), rows.map((r) => r.value)];
}

function normaliseHex(hex: string): string {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return h
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  return h.toUpperCase().slice(0, 6).padEnd(6, "0");
}

function contrastText(hex: string): string {
  const h = normaliseHex(hex);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "111827" : "FFFFFF";
}

export async function exportToXlsx(
  record: CandidateRecord,
  rows: PreviewRow[],
  opts?: { headerColor?: string; sheetName?: string },
): Promise<void> {
  const XLSX = (await import("xlsx-js-style")).default ?? (await import("xlsx-js-style"));
  const aoa = toAOA(rows);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const bg = normaliseHex(opts?.headerColor ?? "#2563EB");
  const fg = contrastText(opts?.headerColor ?? "#2563EB");
  rows.forEach((_, idx) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: idx });
    const cell = sheet[addr];
    if (!cell) return;
    cell.s = {
      fill: { patternType: "solid", fgColor: { rgb: bg } },
      font: { bold: true, color: { rgb: fg } },
      alignment: { vertical: "center", horizontal: "left" },
    };
  });
  sheet["!cols"] = rows.map((r) => ({ wch: Math.max(14, Math.min(40, r.label.length + 6)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, opts?.sheetName || "Candidates");
  XLSX.writeFile(wb, exportFileName(record, "xlsx"));
}

export async function exportToCsv(record: CandidateRecord, rows: PreviewRow[]): Promise<void> {
  const escape = (s: string) => {
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [
    rows.map((r) => escape(r.label)).join(","),
    rows.map((r) => escape(r.value)).join(","),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName(record, "csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
