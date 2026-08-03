// ---------------------------------------------------------------------------
// TalentOS Auth Store — client-side session management
// ---------------------------------------------------------------------------
// Stores the session in localStorage and provides a React hook to read it.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import type { Profile } from "./supabase-types";

const SESSION_KEY = "talentos:auth:v1";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
  profile: Profile;
}

let current: AuthSession | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) current = JSON.parse(raw) as AuthSession;
  } catch {
    current = null;
  }
}

export function saveSession(session: AuthSession): void {
  current = session;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  listeners.forEach((fn) => fn());
}

export function clearSession(): void {
  current = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
  listeners.forEach((fn) => fn());
}

export function getSession(): AuthSession | null {
  hydrate();
  return current;
}

export function useAuthStore(): AuthSession | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => {
      hydrate();
      return current;
    },
    () => null,
  );
}

export function useIsAdmin(): boolean {
  const session = useAuthStore();
  return session?.profile?.role === "admin";
}

export function useIsAuthenticated(): boolean {
  const session = useAuthStore();
  return !!session?.accessToken;
}
