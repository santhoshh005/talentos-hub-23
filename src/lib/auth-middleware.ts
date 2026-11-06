// ---------------------------------------------------------------------------
// TalentOS Auth Middleware — protects server functions
// ---------------------------------------------------------------------------
// Client side: attaches the stored Supabase access token as a Bearer header.
// Server side: verifies the token against Supabase and exposes the caller's
// profile on `context.profile`. Server-only modules are imported lazily so
// they never end up in the client bundle.
// ---------------------------------------------------------------------------

import { createMiddleware } from "@tanstack/react-start";
import { getFreshAccessToken } from "./auth-store";
import type { Profile } from "./supabase-types";

export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const token = await getFreshAccessToken();
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : undefined });
  })
  .server(async ({ next }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { verifySession } = await import("./auth.server");
    const header = getRequestHeader("authorization") ?? "";
    const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim() ?? "";
    if (!token) throw new Error("Unauthorized: please sign in again.");

    let profile: Profile | null = null;
    try {
      profile = await verifySession(token);
    } catch (error) {
      console.error("[auth] session verification failed:", (error as Error).message);
      throw new Error("Unauthorized: could not verify your session. Please sign in again.");
    }
    if (!profile) throw new Error("Unauthorized: your session has expired. Please sign in again.");

    return next({ context: { profile } });
  });

export const adminMiddleware = createMiddleware({ type: "function" })
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (context.profile.role !== "admin") throw new Error("Forbidden: admin access required.");
    return next();
  });
