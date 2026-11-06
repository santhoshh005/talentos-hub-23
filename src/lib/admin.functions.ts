// ---------------------------------------------------------------------------
// TalentOS Admin Functions — TanStack Start server functions
// ---------------------------------------------------------------------------
// Every admin function runs behind adminMiddleware (valid session + admin
// role). incrementUsageFn only lets a signed-in user record their own
// report downloads; AI usage is recorded server-side by the AI functions.
// ---------------------------------------------------------------------------

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware, authMiddleware } from "./auth-middleware";
import {
  listAllUsers,
  getUserById,
  toggleUserAccess,
  updateSubscription,
  updateUsageLimit,
  updateUserNotes,
  setUserRole,
  getPlatformAnalytics,
  softDeleteUser,
  recordUsageSafely,
  getDailyAnalytics,
} from "./admin.server";

const UserIdSchema = z.object({ userId: z.string().uuid() });

function assertNotSelf(callerId: string, targetId: string, action: string): void {
  if (callerId === targetId) throw new Error(`You cannot ${action} your own account.`);
}

export const listUsersFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return listAllUsers();
  });

export const getUserFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(async ({ data }) => {
    return getUserById(data.userId);
  });

export const toggleAccessFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!data.isActive) assertNotSelf(context.profile.id, data.userId, "disable");
    await toggleUserAccess(data.userId, data.isActive);
    return { ok: true };
  });

export const updateSubscriptionFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["trial", "active", "expired", "blocked"]),
        expiresAt: z.string().max(64).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    if (data.status === "blocked" || data.status === "expired") {
      assertNotSelf(context.profile.id, data.userId, "block");
    }
    await updateSubscription(data.userId, data.status, data.expiresAt);
    return { ok: true };
  });

export const updateUsageLimitFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z
      .object({ userId: z.string().uuid(), maxUsage: z.number().int().positive().max(1_000_000) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await updateUsageLimit(data.userId, data.maxUsage);
    return { ok: true };
  });

export const updateNotesFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), notes: z.string().max(5000) }).parse(data),
  )
  .handler(async ({ data }) => {
    await updateUserNotes(data.userId, data.notes);
    return { ok: true };
  });

export const setRoleFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["user", "admin"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (data.role === "user") assertNotSelf(context.profile.id, data.userId, "demote");
    await setUserRole(data.userId, data.role);
    return { ok: true };
  });

export const getAnalyticsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return getPlatformAnalytics();
  });

export const softDeleteUserFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    assertNotSelf(context.profile.id, data.userId, "delete");
    await softDeleteUser(data.userId);
    return { ok: true };
  });

/** Records a report download for the signed-in caller only. */
export const incrementUsageFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z.object({ eventType: z.literal("report_download").default("report_download") }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await recordUsageSafely(context.profile.id, data.eventType);
    return { ok: true };
  });

export const getDailyAnalyticsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator((data: unknown) =>
    z
      .object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(7) })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    return getDailyAnalytics(data.days);
  });
