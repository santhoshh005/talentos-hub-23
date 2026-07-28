import { useState } from "react";
import { Plus, Star, Copy, Trash2, Edit3, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/lib/templates/use-templates";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { TemplateEditor } from "./TemplateEditor";
import { ExcelImportPanel } from "./ExcelImportPanel";

export function TemplateManager() {
  const { templates, favorites, recent, repo } = useTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const editing = editingId ? templates.find((t) => t.id === editingId) : undefined;

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        onClose={() => setEditingId(null)}
        onSave={(patch) => {
          repo.update(editing.id, patch);
          setEditingId(null);
        }}
      />
    );
  }
  if (creating) {
    return (
      <TemplateEditor
        onClose={() => setCreating(false)}
        onSave={(patch) => {
          repo.create({
            name: patch.name || "Untitled template",
            description: patch.description,
            columns: patch.columns ?? [],
            notes: patch.notes,
            export: patch.export,
          });
          setCreating(false);
        }}
      />
    );
  }
  if (importing) {
    return (
      <ExcelImportPanel
        onClose={() => setImporting(false)}
        onCreated={() => setImporting(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Client Templates</h2>
          <p className="text-sm text-muted-foreground">
            Reusable Excel layouts your candidate exports plug into.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setImporting(true)} className="rounded-lg border-white/10 bg-white/[0.03]">
            <LayoutTemplate className="h-4 w-4" /> Import from Excel
          </Button>
          <Button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30"
          >
            <Plus className="h-4 w-4" /> New template
          </Button>
        </div>
      </div>

      {recent.length > 0 && (
        <TemplateGroup title="Recent" items={recent} onEdit={setEditingId} repo={repo} />
      )}
      {favorites.length > 0 && (
        <TemplateGroup title="Favorites" items={favorites} onEdit={setEditingId} repo={repo} />
      )}
      <TemplateGroup title="All templates" items={templates} onEdit={setEditingId} repo={repo} />
    </div>
  );
}

function TemplateGroup({
  title,
  items,
  onEdit,
  repo,
}: {
  title: string;
  items: ClientTemplate[];
  onEdit: (id: string) => void;
  repo: ReturnType<typeof useTemplates>["repo"];
}) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl transition hover:border-accent/40"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold tracking-tight">{t.name}</div>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => repo.toggleFavorite(t.id)}
                className={`grid h-8 w-8 place-items-center rounded-md transition ${
                  t.favorite ? "text-amber-300" : "text-muted-foreground hover:text-amber-300"
                }`}
                aria-label="Favorite"
              >
                <Star className="h-4 w-4" fill={t.favorite ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.columns.slice(0, 5).map((c) => (
                <span key={c.id} className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                  {c.label}
                </span>
              ))}
              {t.columns.length > 5 && (
                <span className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{t.columns.length - 5}
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-1 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(t.id)} className="rounded-lg border-white/10 bg-white/[0.03]">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => repo.duplicate(t.id)}
                className="rounded-lg border-white/10 bg-white/[0.03]"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete "${t.name}"?`)) repo.delete(t.id);
                }}
                className="ml-auto rounded-lg border-white/10 bg-white/[0.03] text-muted-foreground hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}