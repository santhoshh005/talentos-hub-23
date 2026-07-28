import { useCallback, useMemo, useSyncExternalStore } from "react";
import { localTemplateRepository } from "./local-template-repository";
import type { ClientTemplate } from "./template-types";

const repo = localTemplateRepository;

// Version counter increments on every notify. Snapshots are cached against
// this version so useSyncExternalStore sees a stable reference between
// notifications (returning a fresh array each call would infinite-loop).
let version = 0;
const listeners = new Set<() => void>();
let subscribedToRepo = false;
function ensureSubscribed() {
  if (subscribedToRepo) return;
  subscribedToRepo = true;
  repo.subscribe(() => {
    version += 1;
    for (const l of listeners) l();
  });
}

function subscribe(cb: () => void) {
  ensureSubscribed();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getVersion() {
  return version;
}

const EMPTY: ClientTemplate[] = [];

export function useTemplates(): {
  templates: ClientTemplate[];
  recent: ClientTemplate[];
  favorites: ClientTemplate[];
  repo: typeof repo;
} {
  const v = useSyncExternalStore(subscribe, getVersion, () => 0);
  const templates = useMemo(() => (typeof window === "undefined" ? EMPTY : repo.list()), [v]);
  const recent = useMemo(() => (typeof window === "undefined" ? EMPTY : repo.listRecent()), [v]);
  const favorites = useMemo(() => (typeof window === "undefined" ? EMPTY : repo.listFavorites()), [v]);
  return { templates, recent, favorites, repo };
}

export function useTemplate(id: string | undefined): ClientTemplate | undefined {
  const v = useSyncExternalStore(subscribe, getVersion, () => 0);
  return useMemo(
    () => (id && typeof window !== "undefined" ? repo.get(id) : undefined),
    [id, v],
  );
}

// silence unused warning for useCallback if tree-shaken
void useCallback;