import { useSyncExternalStore } from "react";

export interface ActivityEntry {
  id: string;
  type: "analysis" | "jd" | "report";
  label: string;
  score?: number;
  timestamp: number;
}

export interface UsageState {
  totalCandidates: number;
  totalJds: number;
  positionsClosed: number;
  totalReports: number;
  totalMatchScore: number; // sum of all scores for averaging
  matchScoreCount: number; // how many scored analyses
  techStacksDetected: Record<string, number>;
  recentActivity: ActivityEntry[];
}

const STORAGE_KEY = "talentos:usage-tracker:v2.0";

const empty: UsageState = {
  totalCandidates: 0,
  totalJds: 0,
  positionsClosed: 0,
  totalReports: 0,
  totalMatchScore: 0,
  matchScoreCount: 0,
  techStacksDetected: {},
  recentActivity: [],
};

let current: UsageState = { ...empty };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const legacyV1_1 = window.localStorage.getItem("talentos:usage-tracker:v1.1");
    const legacyV1 = window.localStorage.getItem("talentos:usage-tracker:v1");

    if (raw) {
      current = { ...empty, ...(JSON.parse(raw) as Partial<UsageState>) };
    } else if (legacyV1_1) {
      const legacy = JSON.parse(legacyV1_1) as Partial<UsageState>;
      current = {
        ...empty,
        totalCandidates: legacy.totalCandidates ?? 0,
        totalJds: legacy.totalJds ?? 0,
        positionsClosed: legacy.positionsClosed ?? 0,
        techStacksDetected: legacy.techStacksDetected ?? {},
      };
      persist();
    } else if (legacyV1) {
      const legacy = JSON.parse(legacyV1) as Record<string, unknown>;
      const migratedTech: Record<string, number> = {};
      if (Array.isArray(legacy.techStacksDetected)) {
        (legacy.techStacksDetected as string[]).forEach((t) => {
          migratedTech[t] = 1;
        });
      }
      current = {
        ...empty,
        totalCandidates: (legacy.totalCandidates as number) || 0,
        totalJds: (legacy.totalJds as number) || 0,
        positionsClosed: (legacy.positionsClosed as number) || 0,
        techStacksDetected: migratedTech,
      };
      persist();
    }
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

function addActivity(entry: Omit<ActivityEntry, "id">): void {
  const newEntry: ActivityEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const updated = [newEntry, ...current.recentActivity].slice(0, 20); // keep last 20
  current = { ...current, recentActivity: updated };
}

export function trackCandidateAnalysis(techs: string[] = [], score?: number): void {
  hydrate();
  const nextTechs = { ...current.techStacksDetected };
  techs.forEach((t) => {
    nextTechs[t] = (nextTechs[t] || 0) + 1;
  });

  const scorePatch =
    score !== undefined
      ? {
          totalMatchScore: current.totalMatchScore + score,
          matchScoreCount: current.matchScoreCount + 1,
        }
      : {};

  current = {
    ...current,
    totalCandidates: current.totalCandidates + 1,
    techStacksDetected: nextTechs,
    ...scorePatch,
  };

  addActivity({
    type: "analysis",
    label: "Resume analyzed",
    score,
    timestamp: Date.now(),
  });

  persist();
  listeners.forEach((fn) => fn());
}

export function trackJdAnalysis(positionTitle?: string): void {
  hydrate();
  current = { ...current, totalJds: current.totalJds + 1 };

  addActivity({
    type: "jd",
    label: positionTitle ? `JD generated: ${positionTitle}` : "JD generated",
    timestamp: Date.now(),
  });

  persist();
  listeners.forEach((fn) => fn());
}

export function trackReportGenerated(): void {
  hydrate();
  current = { ...current, totalReports: current.totalReports + 1 };

  addActivity({
    type: "report",
    label: "Report downloaded",
    timestamp: Date.now(),
  });

  persist();
  listeners.forEach((fn) => fn());
}

export function getAverageMatchScore(): number {
  if (current.matchScoreCount === 0) return 0;
  return Math.round(current.totalMatchScore / current.matchScoreCount);
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
