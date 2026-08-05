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
  const admin = getSupabaseAdmin() as any;
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .neq("full_name", "Deleted User")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Profile[]) ?? [];
}

/**
 * Get a single user's full profile.
 */
export async function getUserById(userId: string): Promise<Profile | null> {
  const admin = getSupabaseAdmin() as any;
  const { data, error } = await admin.from("profiles").select("*").eq("id", userId).single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Toggle a user's is_active status (enable / disable access).
 */
export async function toggleUserAccess(userId: string, isActive: boolean): Promise<void> {
  const admin = getSupabaseAdmin() as any;
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
  const admin = getSupabaseAdmin() as any;
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
  const admin = getSupabaseAdmin() as any;
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
  const admin = getSupabaseAdmin() as any;
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
  const admin = getSupabaseAdmin() as any;
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
  const admin = getSupabaseAdmin() as any;

  const [{ count: totalUsers }, { count: activeUsers }, { count: trialUsers }, { count: blockedUsers }] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("full_name", "Deleted User"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "trial"),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "blocked")
      .neq("full_name", "Deleted User"),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    trialUsers: trialUsers ?? 0,
    blockedUsers: blockedUsers ?? 0,
  };
}

/**
 * Soft delete a user: suspend them, block subscription, clear PII, and delete usage events.
 */
export async function softDeleteUser(userId: string): Promise<void> {
  const admin = getSupabaseAdmin() as any;

  // 1. Delete associated usage events
  const { error: eventsError } = await admin.from("usage_events").delete().eq("user_id", userId);

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

/**
 * Increment usage tracking
 */
export async function incrementUserUsage(
  userId: string,
  eventType: "analysis" | "jd_generation" | "report_download" = "analysis",
): Promise<void> {
  const admin = getSupabaseAdmin() as any;

  // We first fetch the current count to increment it.
  const { data, error: fetchError } = await admin
    .from("profiles")
    .select("usage_count")
    .eq("id", userId)
    .single();

  if (fetchError || !data) throw new Error(fetchError?.message ?? "Failed to fetch usage");

  const { error: updateError } = await admin
    .from("profiles")
    .update({ usage_count: data.usage_count + 1 } as any)
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);

  // Insert into usage_events for analytics
  await admin.from("usage_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata: {},
  });
}

/**
 * Get daily analytics for the past 7 days
 */
export async function getDailyAnalytics() {
  const admin = getSupabaseAdmin() as any;

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await admin
    .from("usage_events")
    .select("event_type, created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) throw new Error(error.message);

  // Initialize array for the last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create a map for the last 7 days starting from 6 days ago up to today
  const dailyStats: Record<string, { name: string; analyses: number; jds: number }> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyStats[dateStr] = {
      name: days[d.getDay()],
      analyses: 0,
      jds: 0,
    };
  }

  // Aggregate data
  if (data) {
    data.forEach((event: any) => {
      const dateStr = event.created_at.split("T")[0];
      if (dailyStats[dateStr]) {
        if (event.event_type === "analysis") {
          dailyStats[dateStr].analyses += 1;
        } else if (event.event_type === "jd_generation") {
          dailyStats[dateStr].jds += 1;
        }
      }
    });
  }

  return Object.values(dailyStats);
}
