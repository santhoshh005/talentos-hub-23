// ---------------------------------------------------------------------------
// TalentOS — Supabase client (server-side only)
// ---------------------------------------------------------------------------
// Uses the service-role key on the server for full database access.
// The anon key is used on the client side (via browser auth).
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const SUPABASE_ANON_KEY = process.env["SUPABASE_ANON_KEY"];

if (!SUPABASE_URL) {
  console.warn("[supabase] SUPABASE_URL not configured.");
}

/**
 * Server-side Supabase client with service-role key.
 * Has full bypass of RLS — only use on the server.
 */
export function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Server-side Supabase client using the anon key.
 * Respects RLS — used for user-authenticated operations.
 */
export function getSupabaseClient(accessToken?: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  if (accessToken) {
    void client.auth.setSession({ access_token: accessToken, refresh_token: "" });
  }
  return client;
}

export const SUPABASE_ANON_KEY_PUBLIC = SUPABASE_ANON_KEY;
export { SUPABASE_URL };
