import type { ClientTemplate } from "./template-types";
import { DEFAULT_MISMATCH_RULE_SET, normalizeMismatchRuleSet } from "./template-types";
import type { CreateTemplateInput, TemplateRepository } from "./template-repository";
import { seedTemplates } from "./seed-templates";
import { countMismatches } from "./column-diagnostics";

const STORE_KEY = "talentos:templates:v1";
const RECENT_KEY = "talentos:templates:recent:v1";
const RECENT_LIMIT = 8;
const MIGRATION_KEY = "talentos:templates:mismatch-migration:v1";

function uid(): string {
  return `tpl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTemplate(template: ClientTemplate): ClientTemplate {
  const mismatchRuleSet = normalizeMismatchRuleSet(template.mismatchRuleSet ?? DEFAULT_MISMATCH_RULE_SET);
  return {
    ...template,
    mismatchRuleSet,
    needsReview: countMismatches(template.columns, mismatchRuleSet) > 0,
  };
}

function readAll(): ClientTemplate[] {
  if (typeof window === "undefined") return [];
  const stored = safeParse<ClientTemplate[] | null>(localStorage.getItem(STORE_KEY), null);
  if (stored && stored.length > 0) {
    const normalized = stored.map(normalizeTemplate);
    if (JSON.stringify(stored) !== JSON.stringify(normalized)) {
      localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  }
  const seeded = seedTemplates();
  localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function runMismatchMigrationOnce(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_KEY)) return;
  const stored = safeParse<ClientTemplate[] | null>(localStorage.getItem(STORE_KEY), null);
  if (stored && stored.length > 0) {
    const next = stored.map((t) => normalizeTemplate({ ...t, mismatchRuleSet: t.mismatchRuleSet ?? DEFAULT_MISMATCH_RULE_SET }));
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  }
  localStorage.setItem(MIGRATION_KEY, "1");
}

runMismatchMigrationOnce();

function writeAll(items: ClientTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(RECENT_KEY), []);
}

function writeRecent(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
}

class LocalTemplateRepository implements TemplateRepository {
  private listeners = new Set<() => void>();

  private notify() {
    for (const l of this.listeners) l();
  }

  list(): ClientTemplate[] {
    return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): ClientTemplate | undefined {
    return readAll().find((t) => t.id === id);
  }

  create(input: CreateTemplateInput): ClientTemplate {
    const now = Date.now();
    const template: ClientTemplate = {
      id: uid(),
      name: input.name,
      description: input.description,
      columns: input.columns.map((c) => ({ ...c, id: c.id || uid() })),
      notes: input.notes,
      export: input.export,
      headerColor: input.headerColor,
      headerTextColor: input.headerTextColor,
      mismatchRuleSet: normalizeMismatchRuleSet(input.mismatchRuleSet ?? DEFAULT_MISMATCH_RULE_SET),
      needsReview: input.needsReview ?? countMismatches(input.columns, input.mismatchRuleSet) > 0,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([template, ...readAll()]);
    this.notify();
    return template;
  }

  update(id: string, patch: Partial<Omit<ClientTemplate, "id" | "createdAt">>) {
    const all = readAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx < 0) return undefined;
    const next: ClientTemplate = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: Date.now(),
    };
    all[idx] = next;
    writeAll(all);
    this.notify();
    return next;
  }

  duplicate(id: string): ClientTemplate | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    return this.create({
      name: `${src.name} (copy)`,
      description: src.description,
      columns: src.columns.map((c) => ({ ...c, id: uid() })),
      notes: src.notes,
      export: src.export,
      headerColor: src.headerColor,
      headerTextColor: src.headerTextColor,
      mismatchRuleSet: src.mismatchRuleSet,
      needsReview: src.needsReview,
    });
  }

  delete(id: string): void {
    writeAll(readAll().filter((t) => t.id !== id));
    writeRecent(readRecent().filter((r) => r !== id));
    this.notify();
  }

  toggleFavorite(id: string): ClientTemplate | undefined {
    const t = this.get(id);
    if (!t) return undefined;
    return this.update(id, { favorite: !t.favorite });
  }

  markRecent(id: string): void {
    const existing = readRecent().filter((r) => r !== id);
    const next = [id, ...existing].slice(0, RECENT_LIMIT);
    writeRecent(next);
    this.notify();
  }

  listRecent(limit = RECENT_LIMIT): ClientTemplate[] {
    const ids = readRecent().slice(0, limit);
    const all = readAll();
    return ids
      .map((id) => all.find((t) => t.id === id))
      .filter((t): t is ClientTemplate => Boolean(t));
  }

  listFavorites(): ClientTemplate[] {
    return this.list().filter((t) => t.favorite);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const localTemplateRepository: TemplateRepository = new LocalTemplateRepository();