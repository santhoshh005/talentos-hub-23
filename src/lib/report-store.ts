import { useSyncExternalStore } from "react";
import type { PipelineResult } from "./pipeline.functions";

// Small module-level store that hands the last PipelineResult from the
// Resume Analyzer modal to the /report page. Mirrored into sessionStorage
// so a refresh on /report keeps the report visible during the session.

const STORAGE_KEY = "talentos:last-report";

let current: PipelineResult | null = null;
const listeners = new Set<() => void>();
let hydrated = false;

function hydrateFromStorage(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) current = JSON.parse(raw) as PipelineResult;
  } catch {
    current = null;
  }
}

export function getResult(): PipelineResult | null {
  hydrateFromStorage();
  return current;
}

export function setResult(result: PipelineResult): void {
  current = result;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      /* ignore quota / serialization errors */
    }
  }
  listeners.forEach((fn) => fn());
}

export function clearResult(): void {
  current = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useLastReport(): PipelineResult | null {
  return useSyncExternalStore(
    subscribe,
    () => getResult(),
    () => null,
  );
}