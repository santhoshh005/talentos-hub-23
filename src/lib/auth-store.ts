// ---------------------------------------------------------------------------
// TalentOS Auth Store — client-side session management
// ---------------------------------------------------------------------------
// Stores the session in localStorage and provides a React hook to read it.
// ---------------------------------------------------------------------------

import { useEffect, useSyncExternalStore } from "react";
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

// ---------------------------------------------------------------------------
// Token freshness
// ---------------------------------------------------------------------------

const REFRESH_LEEWAY_MS = 2 * 60 * 1000;
let inflightRefresh: Promise<string | null> | null = null;

/** Expiry (ms epoch) from a JWT's `exp` claim, or null if unreadable. */
export function tokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Returns a non-expired access token, refreshing it first when it is within
 * two minutes of expiry. Concurrent callers share one refresh request. If
 * the refresh token is rejected the session is cleared (user must sign in).
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session?.accessToken) return null;
  const exp = tokenExpiryMs(session.accessToken);
  if (exp === null || exp - Date.now() > REFRESH_LEEWAY_MS) return session.accessToken;
  if (!session.refreshToken) return session.accessToken;

  inflightRefresh ??= (async () => {
    try {
      const { refreshSessionFn } = await import("./auth.functions");
      const result = await refreshSessionFn({ data: { refreshToken: session.refreshToken } });
      if (result.ok) {
        saveSession({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
          profile: result.profile,
        });
        return result.accessToken;
      }
      clearSession();
      return null;
    } catch (error) {
      // Network hiccup: keep the session and let the request try anyway.
      console.warn("[auth] token refresh failed:", (error as Error).message);
      return getSession()?.accessToken ?? null;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

/** Keeps the session fresh while the app is open (mount, focus, every 4 min). */
export function useSessionKeepAlive(): void {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void getFreshAccessToken();
    };
    tick();
    const id = setInterval(tick, 4 * 60 * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
}
