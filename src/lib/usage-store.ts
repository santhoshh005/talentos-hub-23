import { useSyncExternalStore } from "react";

export interface UsageState {
  totalCandidates: number;
  totalJds: number;
  positionsClosed: number;
  techStacksDetected: string[];
}

const STORAGE_KEY = "talentos:usage-tracker:v1";

const empty: UsageState = {
  totalCandidates: 0,
  totalJds: 0,
  positionsClosed: 0,
  techStacksDetected: [],
};

let current: UsageState = { ...empty };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) current = { ...empty, ...(JSON.parse(raw) as Partial<UsageState>) };
  } catch {
    current = { ...empty };
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore quota */
  }
}

function getUsage(): UsageState {
  hydrate();
  return current;
}

function trackUsage(patch: Partial<UsageState>): void {
  hydrate();
  current = { ...current, ...patch };
  persist();
  listeners.forEach((fn) => fn());
}

export function trackCandidateAnalysis(techs: string[] = []): void {
  hydrate();
  const nextTechs = new Set([...current.techStacksDetected, ...techs]);
  current = {
    ...current,
    totalCandidates: current.totalCandidates + 1,
    techStacksDetected: Array.from(nextTechs),
  };
  persist();
  listeners.forEach((fn) => fn());
}

export function trackJdAnalysis(): void {
  hydrate();
  current = { ...current, totalJds: current.totalJds + 1 };
  persist();
  listeners.forEach((fn) => fn());
}

export function useUsageStore(): UsageState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => {
      hydrate();
      return current;
    },
    () => empty,
  );
}
