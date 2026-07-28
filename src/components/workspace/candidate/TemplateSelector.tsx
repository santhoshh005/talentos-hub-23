import { Link } from "@tanstack/react-router";
import { Star, LayoutTemplate, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTemplates } from "@/lib/templates/use-templates";
import type { ClientTemplate } from "@/lib/templates/template-types";

export function TemplateSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined;
  onSelect: (t: ClientTemplate) => void;
}) {
  const { templates, recent, favorites, repo } = useTemplates();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Choose Client Template</h3>
        <Link
          to="/workspace/templates"
          className="text-xs text-accent hover:underline"
        >
          Manage templates →
        </Link>
      </div>

      {recent.length > 0 && (
        <Group icon={Clock} label="Recent">
          {recent.map((t) => (
            <TemplateChip
              key={t.id}
              template={t}
              selected={t.id === selectedId}
              onSelect={() => onSelect(t)}
              onToggleFav={() => repo.toggleFavorite(t.id)}
            />
          ))}
        </Group>
      )}

      {favorites.length > 0 && (
        <Group icon={Star} label="Favorites">
          {favorites.map((t) => (
            <TemplateChip
              key={t.id}
              template={t}
              selected={t.id === selectedId}
              onSelect={() => onSelect(t)}
              onToggleFav={() => repo.toggleFavorite(t.id)}
            />
          ))}
        </Group>
      )}

      <Group icon={LayoutTemplate} label="All templates">
        {templates.map((t) => (
          <TemplateChip
            key={t.id}
            template={t}
            selected={t.id === selectedId}
            onSelect={() => onSelect(t)}
            onToggleFav={() => repo.toggleFavorite(t.id)}
          />
        ))}
      </Group>
    </div>
  );
}

function Group({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TemplateChip({
  template,
  selected,
  onSelect,
  onToggleFav,
}: {
  template: ClientTemplate;
  selected: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition",
        selected
          ? "border-accent/60 bg-accent/10 text-foreground"
          : "border-white/10 bg-white/[0.03] hover:border-accent/40",
      )}
    >
      <button type="button" onClick={onSelect} className="flex items-center gap-2 text-left">
        <span className="font-medium">{template.name}</span>
        <span className="text-[10px] text-muted-foreground">{template.columns.length} cols</span>
      </button>
      <button
        type="button"
        onClick={onToggleFav}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-md transition",
          template.favorite ? "text-amber-300" : "text-muted-foreground hover:text-amber-300",
        )}
        aria-label="Toggle favorite"
      >
        <Star className="h-3.5 w-3.5" fill={template.favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}