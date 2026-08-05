// ---------------------------------------------------------------------------
// TalentOS Admin Server — user management operations
// ---------------------------------------------------------------------------

import { getSupabaseAdmin } from "./supabase.server";
import type { Profile, SubscriptionStatus } from "./supabase-types";

export interface UserSummary extends Profile {
  recent_events_count: number;
}

/**
 * List all users with basic stats. Admin only.
 */
export async function listAllUsers(): Promise<Profile[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Profile[]) ?? [];
}

/**
 * Get a single user's full profile.
 */
export async function getUserById(userId: string): Promise<Profile | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Toggle a user's is_active status (enable / disable access).
 */
export async function toggleUserAccess(userId: string, isActive: boolean): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive } as any)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Update a user's subscription status and optional expiry.
 */
export async function updateSubscription(
  userId: string,
  status: SubscriptionStatus,
  expiresAt?: string | null,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: status,
      subscription_expires_at: expiresAt ?? null,
    } as any)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Set a user's usage limit.
 */
export async function updateUsageLimit(userId: string, maxUsage: number): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ max_usage: maxUsage } as any)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Update admin notes for a user.
 */
export async function updateUserNotes(userId: string, notes: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ notes } as any)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Promote or demote user role.
 */
export async function setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ role } as any)
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/**
 * Get platform-wide analytics summary.
 */
export async function getPlatformAnalytics() {
  const admin = getSupabaseAdmin();

  const [{ count: totalUsers }, { count: activeUsers }, { count: trialUsers }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "trial"),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    trialUsers: trialUsers ?? 0,
    blockedUsers: 0,
  };
}

/**
 * Soft delete a user: suspend them, block subscription, clear PII, and delete usage events.
 */
export async function softDeleteUser(userId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  
  // 1. Delete associated usage events
  const { error: eventsError } = await admin
    .from("usage_events")
    .delete()
    .eq("user_id", userId);
    
  if (eventsError) throw new Error(eventsError.message);

  // 2. Soft-delete the profile
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      is_active: false,
      subscription_status: "blocked",
      full_name: "Deleted User",
      notes: "User deleted by admin",
    } as any)
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);
}
