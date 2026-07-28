import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CandidateRecord } from "@/lib/candidate-schemas";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { buildPreviewRow, exportToCsv, exportToXlsx, type PreviewRow } from "@/lib/candidate-export";

export function ExportPreview({
  record,
  template,
}: {
  record: CandidateRecord;
  template: ClientTemplate;
}) {
  const initial = useMemo(() => buildPreviewRow(record, template), [record, template]);
  const [rows, setRows] = useState<PreviewRow[]>(initial);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const updateValue = (i: number, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, value: v } : r)));
  const updateLabel = (i: number, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, label: v } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    setRows((rs) => {
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const addColumn = () =>
    setRows((rs) => [
      ...rs,
      {
        columnId: `custom_${Date.now()}`,
        label: "New column",
        value: "",
      },
    ]);

  const doXlsx = async () => {
    try {
      await exportToXlsx(record, template, rows);
      toast.success("Excel exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };
  const doCsv = async () => {
    try {
      await exportToCsv(record, template, rows);
      toast.success("CSV exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Excel preview</h3>
          <p className="text-xs text-muted-foreground">
            Edit labels or values inline before you export. Column order is preserved.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={doCsv} className="rounded-lg border-white/10 bg-white/[0.03]">
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </Button>
          <Button
            type="button"
            onClick={doXlsx}
            className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30"
          >
            <Download className="h-4 w-4" /> Export .xlsx
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="w-8" />
              {rows.map((r, i) => (
                <th key={r.columnId} className="p-2 text-left">
                  <input
                    value={r.label}
                    onChange={(e) => updateLabel(i, e.target.value)}
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:border-white/10 focus:border-accent focus:bg-white/[0.03] focus:text-foreground focus:outline-none"
                  />
                </th>
              ))}
              <th className="w-10">
                <button
                  type="button"
                  onClick={addColumn}
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  aria-label="Add column"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 align-top">
                <div className="flex flex-col gap-0.5">
                  {rows.map((r, i) => (
                    <button
                      key={r.columnId}
                      type="button"
                      onClick={() => move(i, i === rows.length - 1 ? -1 : 1)}
                      className="grid h-4 w-4 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Reorder"
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </td>
              {rows.map((r, i) => (
                <td key={r.columnId} className="p-1 align-top">
                  <textarea
                    rows={2}
                    value={r.value}
                    onChange={(e) => updateValue(i, e.target.value)}
                    className="w-full resize-y rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-xs text-foreground/90 outline-none focus:border-accent focus:ring-1 focus:ring-accent/40"
                  />
                </td>
              ))}
              <td className="p-1 align-top">
                <div className="flex flex-col gap-1">
                  {rows.map((r, i) => (
                    <button
                      key={r.columnId}
                      type="button"
                      onClick={() => remove(i)}
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Remove column"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}