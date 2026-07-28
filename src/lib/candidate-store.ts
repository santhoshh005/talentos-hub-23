// Persistent store for the Candidate Workspace record + phase.
// Prevents losing the uploaded resume when the user navigates to another
// workspace tab and comes back.

import { useSyncExternalStore } from "react";
import { emptyCandidateRecord, type CandidateRecord } from "./candidate-schemas";

export type CandidatePhase = "upload" | "extracting" | "snapshot" | "edit";

export interface CandidateWorkspaceState {
  phase: CandidatePhase;
  record: CandidateRecord;
}

const STORAGE_KEY = "talentos:candidate-workspace:v1";

function makeEmpty(): CandidateWorkspaceState {
  return { phase: "upload", record: emptyCandidateRecord() };
}

let current: CandidateWorkspaceState = makeEmpty();
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<CandidateWorkspaceState>;
    // Never resume mid-extraction — that in-flight promise is gone.
    const phase: CandidatePhase =
      parsed.phase === "extracting" || !parsed.phase ? "upload" : parsed.phase;
    current = {
      phase,
      record: parsed.record ?? emptyCandidateRecord(),
    };
  } catch {
    current = makeEmpty();
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

export function getCandidateState(): CandidateWorkspaceState {
  hydrate();
  return current;
}

export function setCandidateState(patch: Partial<CandidateWorkspaceState>): void {
  hydrate();
  current = { ...current, ...patch };
  persist();
  listeners.forEach((fn) => fn());
}

export function clearCandidateState(): void {
  current = makeEmpty();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function useCandidateState(): CandidateWorkspaceState {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => {
      hydrate();
      return current;
    },
    () => makeEmpty(),
  );
}