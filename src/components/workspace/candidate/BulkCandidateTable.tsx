import { useEffect, useMemo, useState } from "react";
import { Download, RotateCcw, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CandidateRecord } from "@/lib/candidate-schemas";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { DEFAULT_HEADER_COLOR, DEFAULT_HEADER_TEXT_COLOR } from "@/lib/templates/template-types";
import { buildPreviewRow, exportBulkXlsx } from "@/lib/candidate-export";
import { display } from "@/lib/candidate-display";
import { AddResumesButton } from "./CandidateUpload";
import { HeaderColorControl } from "./ExportPreview";

export type BulkStatus = "queued" | "parsing" | "extracting" | "done" | "failed";

export interface BulkItem {
  id: string;
  fileName: string;
  status: BulkStatus;
  error?: string;
  record: CandidateRecord;
}

export function BulkCandidateTable({
  items,
  template,
  onReset,
  onEditRecord,
  onAddFiles,
}: {
  items: BulkItem[];
  template: ClientTemplate;
  onReset: () => void;
  onEditRecord: (id: string, patch: Partial<CandidateRecord>) => void;
  onAddFiles?: (files: File[]) => void;
}) {
  const [headerBg, setHeaderBg] = useState<string>(template.headerColor ?? DEFAULT_HEADER_COLOR);
  useEffect(() => {
    setHeaderBg(template.headerColor ?? DEFAULT_HEADER_COLOR);
  }, [template.headerColor]);
  const headerFg = template.headerTextColor ?? DEFAULT_HEADER_TEXT_COLOR;

  const doneItems = items.filter((i) => i.status === "done" || i.status === "failed");
  const stillWorking = items.some((i) => i.status !== "done" && i.status !== "failed");

  const rowsPerRecord = useMemo(
    () => doneItems.map((i) => buildPreviewRow(i.record, template)),
    [doneItems, template],
  );
  const header = rowsPerRecord[0]?.map((r) => r.label) ?? template.columns.filter((c) => !c.hidden).map((c) => c.label);

  const doExport = async () => {
    try {
      await exportBulkXlsx(doneItems.map((i) => i.record), template, rowsPerRecord, headerBg);
      toast.success(`Exported ${doneItems.length} candidate${doneItems.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };

  const progress = items.filter((i) => i.status === "done" || i.status === "failed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const succeeded = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Bulk resume extraction</h2>
          <p className="text-xs text-muted-foreground">
            {progress} of {items.length} processed · {succeeded} ready · {failed} failed
          </p>
          <div className="mt-2 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${items.length ? (progress / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <HeaderColorControl value={headerBg} onChange={setHeaderBg} />
          {onAddFiles && <AddResumesButton onFiles={onAddFiles} />}
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-lg border-white/10 bg-white/[0.03]"
          >
            <RotateCcw className="h-4 w-4" /> Start over
          </Button>
          <Button
            type="button"
            onClick={doExport}
            disabled={stillWorking || doneItems.length === 0}
            className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export .xlsx ({doneItems.length})
          </Button>
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2">
              <StatusIcon status={i.status} />
              <div className="truncate">
                <div className="truncate font-medium">{i.fileName}</div>
                {i.error && <div className="truncate text-[10px] text-rose-300/80">{i.error}</div>}
                {i.status === "done" && (
                  <div className="truncate text-[10px] text-muted-foreground">
                    {display(i.record.fullName)} · {display(i.record.email)} · {display(i.record.mobile)}
                  </div>
                )}
              </div>
            </div>
            <StatusLabel status={i.status} />
          </div>
        ))}
      </div>

      {doneItems.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
          <h3 className="text-sm font-semibold">Excel preview</h3>
          <p className="text-xs text-muted-foreground">
            Edit any cell before export. Header uses your template color.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[720px] text-xs">
              <thead>
                <tr style={{ background: headerBg }}>
                  {header.map((label) => (
                    <th
                      key={label}
                      className="p-2 text-left text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: headerFg }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doneItems.map((item, rIdx) => (
                  <tr key={item.id} className="border-t border-white/5">
                    {rowsPerRecord[rIdx]?.map((cell) => (
                      <td key={cell.columnId} className="p-1 align-top">
                        <textarea
                          rows={2}
                          value={cell.value}
                          placeholder="NA"
                          onChange={(e) => onEditRecord(item.id, patchFromCell(item.record, cell.columnId, template, e.target.value))}
                          className={`w-full resize-y rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 ${
                            cell.value.trim() ? "text-foreground/90" : "italic text-muted-foreground"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function patchFromCell(
  _record: CandidateRecord,
  columnId: string,
  template: ClientTemplate,
  value: string,
): Partial<CandidateRecord> {
  const col = template.columns.find((c) => c.id === columnId);
  if (!col || col.fieldKey.startsWith("__")) return {};
  // Only patch scalar string fields directly; arrays are edited via the single-record editor.
  const key = col.fieldKey as keyof CandidateRecord;
  const patch: Record<string, unknown> = { [key]: value };
  return patch as Partial<CandidateRecord>;
}

function StatusIcon({ status }: { status: BulkStatus }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />;
  if (status === "queued") return <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />;
}

function StatusLabel({ status }: { status: BulkStatus }) {
  const map: Record<BulkStatus, { label: string; className: string }> = {
    queued: { label: "Queued", className: "text-muted-foreground" },
    parsing: { label: "Parsing", className: "text-accent" },
    extracting: { label: "Extracting", className: "text-accent" },
    done: { label: "Ready", className: "text-emerald-400" },
    failed: { label: "Failed · NA", className: "text-rose-300" },
  };
  const { label, className } = map[status];
  return <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest ${className}`}>{label}</span>;
}