// ---------------------------------------------------------------------------
// TalentOS Auth Server — login / signup / session helpers
// ---------------------------------------------------------------------------

import { getSupabaseAdmin, getSupabaseClient } from "./supabase.server";
import type { Profile } from "./supabase-types";

export interface AuthResult {
  ok: true;
  user: { id: string; email: string };
  profile: Profile;
  accessToken: string;
  refreshToken: string;
}

export interface AuthError {
  ok: false;
  error: string;
}

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "";

/**
 * Sign in with email and password.
 * Returns the session tokens and the user's profile.
 */
export async function signIn(email: string, password: string): Promise<AuthResult | AuthError> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { ok: false, error: error?.message ?? "Login failed" };
  }

  const profile = await getProfile(data.user.id);
  if (!profile) {
    return { ok: false, error: "Profile not found. Please contact admin." };
  }

  if (!profile.is_active || profile.subscription_status === "blocked") {
    return { ok: false, error: "Your account has been suspended. Please contact admin." };
  }

  if (profile.subscription_status === "expired") {
    return { ok: false, error: "Your subscription has expired. Please renew to continue." };
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email! },
    profile,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/**
 * Sign up with email, password, and name.
 * Auto-assigns admin role if email matches ADMIN_EMAIL env var.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResult | AuthError> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Sign up failed" };
  }

  // If email confirmation is required, session will be null
  if (!data.session) {
    return {
      ok: false,
      error: "Please check your email to confirm your account, then log in.",
    };
  }

  // Auto-promote to admin if this is the configured admin email
  if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    const admin = getSupabaseAdmin();
    await admin
      .from("profiles")
      .update({
        role: "admin",
        subscription_status: "active",
        max_usage: 999999, // unlimited for admin
      } as any)
      .eq("id", data.user.id);
  }

  const profile = await getProfile(data.user.id);
  if (!profile) {
    return { ok: false, error: "Profile creation failed." };
  }

  return {
    ok: true,
    user: { id: data.user.id, email: data.user.email! },
    profile,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/**
 * Sign out — invalidates the current session.
 */
export async function signOut(accessToken: string): Promise<void> {
  const supabase = getSupabaseClient(accessToken);
  await supabase.auth.signOut();
}

/**
 * Verify an access token and return the associated profile.
 * Returns null if the token is invalid or expired.
 */
export async function verifySession(accessToken: string): Promise<Profile | null> {
  const supabase = getSupabaseClient(accessToken);
  const { data } = await supabase.auth.getUser(accessToken);
  if (!data.user) return null;

  const profile = await getProfile(data.user.id);
  if (!profile) return null;

  // Check access
  if (!profile.is_active || profile.subscription_status === "blocked") return null;

  return profile;
}

/**
 * Fetch a profile by user ID using the admin client (bypasses RLS).
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) return null;
  return data as Profile;
}
