import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Plus, GripVertical, RotateCcw, Eye, EyeOff } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { CandidateRecord } from "@/lib/candidate-schemas";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { DEFAULT_HEADER_COLOR, DEFAULT_HEADER_TEXT_COLOR } from "@/lib/templates/template-types";
import { buildPreviewRow, exportToCsv, exportToXlsx, type PreviewRow } from "@/lib/candidate-export";
import { display } from "@/lib/candidate-display";

export function ExportPreview({
  record,
  template,
}: {
  record: CandidateRecord;
  template: ClientTemplate;
}) {
  const initial = useMemo(() => buildPreviewRow(record, template), [record, template]);
  const [rows, setRows] = useState<PreviewRow[]>(initial);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRows(initial);
    setHidden(new Set());
  }, [initial]);

  const updateValue = (i: number, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, value: v } : r)));
  const updateLabel = (i: number, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, label: v } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const addColumn = () =>
    setRows((rs) => [
      ...rs,
      {
        columnId: `custom_${Date.now()}`,
        label: "New column",
        value: "",
      },
    ]);
  const reset = () => {
    setRows(initial);
    setHidden(new Set());
  };
  const toggleHidden = (id: string) =>
    setHidden((h) => {
      const next = new Set(h);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((rs) => {
      const oldIdx = rs.findIndex((r) => r.columnId === active.id);
      const newIdx = rs.findIndex((r) => r.columnId === over.id);
      if (oldIdx < 0 || newIdx < 0) return rs;
      return arrayMove(rs, oldIdx, newIdx);
    });
  };

  const visibleRows = rows.filter((r) => !hidden.has(r.columnId));
  const previewRows: PreviewRow[] = visibleRows.map((r) => ({ ...r, value: display(r.value) }));
  const headerBg = template.headerColor ?? DEFAULT_HEADER_COLOR;
  const headerFg = template.headerTextColor ?? DEFAULT_HEADER_TEXT_COLOR;

  const doXlsx = async () => {
    try {
      await exportToXlsx(record, template, visibleRows);
      toast.success("Excel exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };
  const doCsv = async () => {
    try {
      await exportToCsv(record, template, visibleRows);
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
            Drag rows to reorder columns, hide any you don't need, then export.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={reset} className="rounded-lg border-white/10 bg-white/[0.03]">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Column rearranger */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Column order
            </div>
            <button
              type="button"
              onClick={addColumn}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.columnId)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {rows.map((r, i) => (
                  <SortableRow
                    key={r.columnId}
                    id={r.columnId}
                    label={r.label}
                    hidden={hidden.has(r.columnId)}
                    onLabelChange={(v) => updateLabel(i, v)}
                    onToggleHidden={() => toggleHidden(r.columnId)}
                    onRemove={() => remove(i)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        {/* Spreadsheet preview */}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-white/10" style={{ background: headerBg }}>
                {previewRows.map((r) => (
                  <th
                    key={r.columnId}
                    className="p-2 text-left text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: headerFg }}
                  >
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {visibleRows.map((r, i) => {
                  const isNa = !r.value.trim();
                  return (
                    <td key={r.columnId} className="p-1 align-top">
                      <textarea
                        rows={2}
                        value={r.value}
                        placeholder="NA"
                        onChange={(e) =>
                          updateValue(rows.findIndex((x) => x.columnId === r.columnId), e.target.value)
                        }
                        className={`w-full resize-y rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 ${
                          isNa ? "text-muted-foreground italic" : "text-foreground/90"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SortableRow({
  id,
  label,
  hidden,
  onLabelChange,
  onToggleHidden,
  onRemove,
}: {
  id: string;
  label: string;
  hidden: boolean;
  onLabelChange: (v: string) => void;
  onToggleHidden: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 rounded-lg border border-white/5 px-2 py-1.5 ${
        hidden ? "bg-white/[0.01] opacity-60" : "bg-white/[0.03]"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <input
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-foreground/90 hover:border-white/10 focus:border-accent focus:bg-white/[0.03] focus:outline-none"
      />
      <button
        type="button"
        onClick={onToggleHidden}
        className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
        aria-label={hidden ? "Show column" : "Hide column"}
      >
        {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
        aria-label="Remove column"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}