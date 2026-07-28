// Persistent store for the Resume Intelligence intake (resume text + JD).
// Survives modal close and workspace tab navigation within the session.

import { useSyncExternalStore } from "react";

export interface IntakeState {
  resumeText: string;
  resumeName: string;
  jobDescription: string;
  jdMode: "paste" | "upload";
  jdFileName: string;
}

const STORAGE_KEY = "talentos:intelligence-intake:v1";

const empty: IntakeState = {
  resumeText: "",
  resumeName: "",
  jobDescription: "",
  jdMode: "paste",
  jdFileName: "",
};

let current: IntakeState = { ...empty };
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) current = { ...empty, ...(JSON.parse(raw) as Partial<IntakeState>) };
  } catch {
    current = { ...empty };
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore quota */
  }
}

export function getIntake(): IntakeState {
  hydrate();
  return current;
}

export function setIntake(patch: Partial<IntakeState>): void {
  hydrate();
  current = { ...current, ...patch };
  persist();
  listeners.forEach((fn) => fn());
}

export function clearIntake(): void {
  current = { ...empty };
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function useIntake(): IntakeState {
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