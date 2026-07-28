import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Trash2, Plus, GripVertical, RotateCcw, Eye, EyeOff, Paintbrush } from "lucide-react";
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
import { exportToCsv, exportToXlsx, type PreviewRow } from "@/lib/candidate-export";
import { buildDefaultRows } from "@/lib/candidate-default-headers";
import { display } from "@/lib/candidate-display";

const HEADER_COLORS: { label: string; value: string }[] = [
  { label: "Blue", value: "#2563EB" },
  { label: "Cyan", value: "#38BDF8" },
  { label: "Emerald", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F43F5E" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Slate", value: "#334155" },
  { label: "White", value: "#FFFFFF" },
];

export function ExportPreview({ record }: { record: CandidateRecord }) {
  const initial = useMemo(() => buildDefaultRows(record), [record]);
  const [rows, setRows] = useState<PreviewRow[]>(initial);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [headerColor, setHeaderColor] = useState<string>("#2563EB");
  const [customColor, setCustomColor] = useState<string>("#2563EB");

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

  const doXlsx = async () => {
    try {
      await exportToXlsx(record, visibleRows, { headerColor });
      toast.success("Excel exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    }
  };
  const doCsv = async () => {
    try {
      await exportToCsv(record, visibleRows);
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

      {/* Header color picker */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Paintbrush className="h-3.5 w-3.5" /> Header color
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {HEADER_COLORS.map((c) => {
            const active = headerColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setHeaderColor(c.value)}
                title={c.label}
                aria-label={`Set header color to ${c.label}`}
                className={`h-6 w-6 rounded-md border transition ${
                  active ? "border-white ring-2 ring-accent/60 scale-110" : "border-white/20"
                }`}
                style={{ backgroundColor: c.value }}
              />
            );
          })}
          <label className="ml-1 flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px] text-muted-foreground">
            Custom
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                setHeaderColor(e.target.value);
              }}
              className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
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
              <tr className="border-b border-white/10">
                {previewRows.map((r) => (
                  <th
                    key={r.columnId}
                    className="p-2 text-left text-[10px] font-semibold uppercase tracking-widest"
                    style={{
                      backgroundColor: headerColor,
                      color: isLight(headerColor) ? "#111827" : "#FFFFFF",
                    }}
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

function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
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