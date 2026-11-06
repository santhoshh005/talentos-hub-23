// ---------------------------------------------------------------------------
// TalentOS Admin Server — user management operations
// ---------------------------------------------------------------------------

import { getSupabaseAdmin } from "./supabase.server";
import type { Profile, SubscriptionStatus } from "./supabase-types";
import { aggregateUserStats, type MyStats, type UsageEventRow } from "./usage-stats";

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

  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: trialUsers },
    { count: blockedUsers },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("full_name", "Deleted User"),
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

  const countEvents = (type: string) =>
    admin.from("usage_events").select("*", { count: "exact", head: true }).eq("event_type", type);
  const [analyses, jds, reports, topUsersRes, nearLimitRes] = await Promise.all([
    countEvents("analysis"),
    countEvents("jd_generation"),
    countEvents("report_download"),
    admin
      .from("profiles")
      .select("id, full_name, email, usage_count, max_usage, role")
      .neq("full_name", "Deleted User")
      .order("usage_count", { ascending: false })
      .limit(5),
    admin
      .from("profiles")
      .select("usage_count, max_usage, role")
      .neq("full_name", "Deleted User")
      .eq("role", "user")
      .gt("usage_count", 0)
      .limit(5000),
  ]);

  const nearLimit = (
    (nearLimitRes.data ?? []) as Array<{ usage_count: number; max_usage: number }>
  ).filter((p) => p.max_usage > 0 && p.usage_count / p.max_usage >= 0.8).length;

  return {
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    trialUsers: trialUsers ?? 0,
    blockedUsers: blockedUsers ?? 0,
    usersNearLimit: nearLimit,
    totals: {
      analyses: analyses.count ?? 0,
      jds: jds.count ?? 0,
      reports: reports.count ?? 0,
    },
    topUsers: ((topUsersRes.data ?? []) as Array<Record<string, unknown>>).map((u) => ({
      id: String(u.id),
      name: String(u.full_name || u.email || "Unknown"),
      usage: Number(u.usage_count ?? 0),
      limit: Number(u.max_usage ?? 0),
      role: String(u.role ?? "user"),
    })),
    health: {
      database: true,
      aiConfigured: Boolean(process.env["AI_API_KEY"] || process.env["GROQ_API_KEY"]),
    },
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
 * Server-side quota gate for AI features. Admins are never limited.
 * Throws a user-facing error when the caller cannot run another AI action.
 */
export function assertUsageAvailable(profile: Profile): void {
  if (profile.role === "admin") return;
  if (profile.subscription_status === "expired") {
    throw new Error("Your subscription has expired. Please renew to continue.");
  }
  const limit = Number(profile.max_usage ?? 0);
  const used = Number(profile.usage_count ?? 0);
  if (limit > 0 && used >= limit) {
    throw new Error(
      `Usage limit reached (${used}/${limit}). Contact your administrator to raise your limit.`,
    );
  }
}

/**
 * Record usage without letting analytics failures break the user's request.
 */
export type UsageEventType = "analysis" | "jd_generation" | "report_download";
export type UsageMetadata = Record<string, string | number | boolean | string[] | null>;

export async function recordUsageSafely(
  userId: string,
  eventType: UsageEventType,
  metadata: UsageMetadata = {},
): Promise<void> {
  try {
    await incrementUserUsage(userId, eventType, metadata);
  } catch (error) {
    console.error(`[usage] failed to record ${eventType}:`, (error as Error).message);
  }
}

/** Events that consume plan quota. Report downloads are logged but free. */
const QUOTA_EVENTS: ReadonlySet<UsageEventType> = new Set(["analysis", "jd_generation"]);

/**
 * Record a usage event and, for AI actions, increment the user's quota
 * counter. The increment is a compare-and-set (update only while the value is
 * still what we read), retried on conflict, so concurrent requests cannot
 * overwrite each other's increments.
 */
export async function incrementUserUsage(
  userId: string,
  eventType: UsageEventType = "analysis",
  metadata: UsageMetadata = {},
): Promise<void> {
  const admin = getSupabaseAdmin() as any;

  if (QUOTA_EVENTS.has(eventType)) {
    let applied = false;
    for (let attempt = 0; attempt < 5 && !applied; attempt++) {
      const { data, error: fetchError } = await admin
        .from("profiles")
        .select("usage_count")
        .eq("id", userId)
        .single();
      if (fetchError || !data) throw new Error(fetchError?.message ?? "Failed to fetch usage");

      const current = Number(data.usage_count ?? 0);
      const { data: updated, error: updateError } = await admin
        .from("profiles")
        .update({ usage_count: current + 1 } as any)
        .eq("id", userId)
        .eq("usage_count", current)
        .select("id");
      if (updateError) throw new Error(updateError.message);
      applied = Array.isArray(updated) && updated.length > 0;
    }
    if (!applied) throw new Error("Usage counter busy; increment not applied after 5 attempts");
  }

  const { error: insertError } = await admin.from("usage_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata,
  });
  if (insertError) throw new Error(insertError.message);
}

const STATS_PAGE_SIZE = 1000;

/** Aggregates the caller's own usage events (cross-device dashboard). */
export async function getUserStats(userId: string): Promise<MyStats> {
  const admin = getSupabaseAdmin() as any;
  const rows: UsageEventRow[] = [];
  for (let from = 0; from < 10_000; from += STATS_PAGE_SIZE) {
    const { data, error } = await admin
      .from("usage_events")
      .select("id, event_type, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, from + STATS_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < STATS_PAGE_SIZE) break;
  }
  return aggregateUserStats(rows);
}

export interface DailyAnalyticsPoint {
  date: string; // YYYY-MM-DD (UTC)
  name: string; // short label, e.g. "Mon 03"
  analyses: number;
  jds: number;
  reports: number;
}

export interface DailyAnalytics {
  days: number;
  series: DailyAnalyticsPoint[];
  totals: { analyses: number; jds: number; reports: number; activeUsers: number };
}

const PAGE_SIZE = 1000;

/**
 * Daily usage for the last `days` days (UTC buckets). Pages through
 * usage_events so busy periods are not truncated by Supabase's row cap.
 */
export async function getDailyAnalytics(days = 7): Promise<DailyAnalytics> {
  const admin = getSupabaseAdmin() as any;
  const span = Math.max(1, Math.min(90, Math.round(days)));

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (span - 1));

  const rows: Array<{ event_type: string; created_at: string; user_id: string }> = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("usage_events")
      .select("event_type, created_at, user_id")
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE || rows.length >= 50_000) break;
  }

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets = new Map<string, DailyAnalyticsPoint>();
  for (let i = 0; i < span; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    const name = span <= 7 ? weekday[d.getUTCDay()] : `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
    buckets.set(date, { date, name, analyses: 0, jds: 0, reports: 0 });
  }

  const users = new Set<string>();
  const totals = { analyses: 0, jds: 0, reports: 0, activeUsers: 0 };
  for (const event of rows) {
    const bucket = buckets.get(String(event.created_at).slice(0, 10));
    if (!bucket) continue;
    if (event.user_id) users.add(event.user_id);
    if (event.event_type === "analysis") {
      bucket.analyses += 1;
      totals.analyses += 1;
    } else if (event.event_type === "jd_generation") {
      bucket.jds += 1;
      totals.jds += 1;
    } else if (event.event_type === "report_download") {
      bucket.reports += 1;
      totals.reports += 1;
    }
  }
  totals.activeUsers = users.size;

  return { days: span, series: Array.from(buckets.values()), totals };
}
