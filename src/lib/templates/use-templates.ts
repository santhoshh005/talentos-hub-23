import { useCallback, useSyncExternalStore } from "react";
import { localTemplateRepository } from "./local-template-repository";
import type { ClientTemplate } from "./template-types";

const repo = localTemplateRepository;

function subscribe(cb: () => void) {
  return repo.subscribe(cb);
}

export function useTemplates(): {
  templates: ClientTemplate[];
  recent: ClientTemplate[];
  favorites: ClientTemplate[];
  repo: typeof repo;
} {
  const templates = useSyncExternalStore(
    subscribe,
    useCallback(() => repo.list(), []),
    useCallback(() => [], []),
  );
  const recent = useSyncExternalStore(
    subscribe,
    useCallback(() => repo.listRecent(), []),
    useCallback(() => [], []),
  );
  const favorites = useSyncExternalStore(
    subscribe,
    useCallback(() => repo.listFavorites(), []),
    useCallback(() => [], []),
  );
  return { templates, recent, favorites, repo };
}

export function useTemplate(id: string | undefined): ClientTemplate | undefined {
  return useSyncExternalStore(
    subscribe,
    useCallback(() => (id ? repo.get(id) : undefined), [id]),
    useCallback(() => undefined, []),
  );
}