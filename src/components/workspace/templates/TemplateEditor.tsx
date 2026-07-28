import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CANDIDATE_FIELDS } from "@/lib/candidate-schemas";
import type { ClientTemplate, TemplateColumn } from "@/lib/templates/template-types";
import { DEFAULT_HEADER_COLOR, DEFAULT_HEADER_TEXT_COLOR } from "@/lib/templates/template-types";
import { diagnoseColumn } from "@/lib/templates/column-diagnostics";
import { AlertTriangle } from "lucide-react";

function uid() {
  return `col_${Math.random().toString(36).slice(2, 9)}`;
}

export function TemplateEditor({
  template,
  onClose,
  onSave,
}: {
  template?: ClientTemplate;
  onClose: () => void;
  onSave: (patch: Partial<Omit<ClientTemplate, "id" | "createdAt">>) => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [sheetName, setSheetName] = useState(template?.export?.sheetName ?? "Candidates");
  const [columns, setColumns] = useState<TemplateColumn[]>(template?.columns ?? []);
  const [headerColor, setHeaderColor] = useState(template?.headerColor ?? DEFAULT_HEADER_COLOR);
  const [headerTextColor, setHeaderTextColor] = useState(
    template?.headerTextColor ?? DEFAULT_HEADER_TEXT_COLOR,
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fieldOptions = useMemo(
    () => [
      ...CANDIDATE_FIELDS.map((f) => ({ value: f.key, label: `${f.group} · ${f.label}` })),
      { value: "__custom", label: "Custom column (no field)" },
    ],
    [],
  );

  const addColumn = () =>
    setColumns((c) => [
      ...c,
      { id: uid(), fieldKey: "__custom", label: "New column", defaultValue: "" },
    ]);

  const patchCol = (id: string, p: Partial<TemplateColumn>) =>
    setColumns((c) => c.map((col) => (col.id === id ? { ...col, ...p } : col)));

  const removeCol = (id: string) => setColumns((c) => c.filter((col) => col.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setColumns((cs) => {
        const oldIdx = cs.findIndex((c) => c.id === active.id);
        const newIdx = cs.findIndex((c) => c.id === over.id);
        return arrayMove(cs, oldIdx, newIdx);
      });
    }
  };

  const save = () =>
    onSave({
      name: name.trim() || "Untitled template",
      description: description.trim(),
      notes: notes.trim(),
      columns,
      export: { sheetName: sheetName.trim() || "Candidates" },
      headerColor,
      headerTextColor,
      needsReview: columns.some((c) => diagnoseColumn(c).mismatch),
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </button>
        <Button type="button" onClick={save} className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30">
          <Save className="h-4 w-4" /> Save template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Template name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            placeholder="CGI Submission Tracker"
          />
        </Field>
        <Field label="Sheet name">
          <input
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </Field>
      </div>
      <Field label="Description">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          placeholder="Optional description"
        />
      </Field>
      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </Field>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Header style</h3>
            <p className="text-xs text-muted-foreground">
              Pick any color for the header row in the exported Excel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHeaderColor(DEFAULT_HEADER_COLOR);
              setHeaderTextColor(DEFAULT_HEADER_TEXT_COLOR);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_minmax(0,1.2fr)]">
          <ColorField label="Background" value={headerColor} onChange={setHeaderColor} />
          <ColorField label="Text" value={headerTextColor} onChange={setHeaderTextColor} />
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Preview
            </span>
            <div
              className="mt-1.5 overflow-hidden rounded-lg border border-white/10"
              style={{ background: headerColor }}
            >
              <div
                className="px-3 py-2 text-xs font-semibold tracking-wide"
                style={{ color: headerTextColor }}
              >
                Candidate Name · Email · Mobile
              </div>
              <div className="bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                Sample row
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Columns</h3>
          <Button type="button" variant="outline" onClick={addColumn} className="rounded-lg border-white/10 bg-white/[0.03]">
            <Plus className="h-4 w-4" /> Add column
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={columns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-4 space-y-2">
              {columns.map((col) => {
                const d = diagnoseColumn(col);
                return (
                <SortableRow key={col.id} column={col} mismatch={d.mismatch}>
                  <select
                    value={fieldOptions.find((f) => f.value === col.fieldKey) ? col.fieldKey : "__custom"}
                    onChange={(e) => patchCol(col.id, { fieldKey: e.target.value })}
                    className={`min-w-[180px] rounded-md border bg-white/[0.03] px-2 py-1.5 text-xs outline-none focus:border-accent ${d.mismatch ? "border-amber-400/50 text-amber-100" : "border-white/10"}`}
                  >
                    {fieldOptions.map((o) => (
                      <option key={o.value} value={o.value} className="bg-background">
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={col.label}
                    onChange={(e) => patchCol(col.id, { label: e.target.value })}
                    placeholder="Column label"
                    className="flex-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs outline-none focus:border-accent"
                  />
                  <input
                    value={col.defaultValue ?? ""}
                    onChange={(e) => patchCol(col.id, { defaultValue: e.target.value })}
                    placeholder="Default value"
                    className="w-40 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs outline-none focus:border-accent"
                  />
                  {d.mismatch && d.suggestedKey && (
                    <button
                      type="button"
                      onClick={() => patchCol(col.id, { fieldKey: d.suggestedKey! })}
                      className="rounded-md bg-amber-400/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-400/30"
                      title={`Map to ${d.suggestedLabel}`}
                    >
                      Map → {d.suggestedLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeCol(col.id)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Remove column"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </SortableRow>
                );
              })}
              {columns.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
                  No columns yet. Add one to get started.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
        {columns.some((c) => diagnoseColumn(c).mismatch) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">Some columns may be reading the wrong field.</div>
              <div className="text-amber-200/80">
                The header label suggests one field but the source field selector points elsewhere.
                Use the "Map → …" chip on flagged rows to align them.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
          aria-label={`${label} color picker`}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0F172A"
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-accent"
        />
      </div>
    </label>
  );
}

function SortableRow({ column, children, mismatch }: { column: TemplateColumn; children: React.ReactNode; mismatch?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 ${mismatch ? "border-amber-400/40 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02]"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="grid h-8 w-8 cursor-grab place-items-center rounded-md text-muted-foreground hover:bg-white/[0.05]"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}