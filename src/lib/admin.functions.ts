// ---------------------------------------------------------------------------
// TalentOS Admin Functions — TanStack Start server functions
// ---------------------------------------------------------------------------

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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
  incrementUserUsage,
  getDailyAnalytics,
} from "./admin.server";

const UserIdSchema = z.object({ userId: z.string().uuid() });

export const listUsersFn = createServerFn({ method: "GET" }).handler(async () => {
  return listAllUsers();
});

export const getUserFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(async ({ data }) => {
    return getUserById(data.userId);
  });

export const toggleAccessFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await toggleUserAccess(data.userId, data.isActive);
    return { ok: true };
  });

export const updateSubscriptionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["trial", "active", "expired", "blocked"]),
        expiresAt: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await updateSubscription(data.userId, data.status, data.expiresAt);
    return { ok: true };
  });

export const updateUsageLimitFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), maxUsage: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ data }) => {
    await updateUsageLimit(data.userId, data.maxUsage);
    return { ok: true };
  });

export const updateNotesFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), notes: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    await updateUserNotes(data.userId, data.notes);
    return { ok: true };
  });

export const setRoleFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["user", "admin"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    await setUserRole(data.userId, data.role);
    return { ok: true };
  });

export const getAnalyticsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getPlatformAnalytics();
});

export const softDeleteUserFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => UserIdSchema.parse(data))
  .handler(async ({ data }) => {
    await softDeleteUser(data.userId);
    return { ok: true };
  });

export const incrementUsageFn = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        eventType: z.enum(["analysis", "jd_generation", "report_download"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await incrementUserUsage(data.userId, data.eventType);
    return { ok: true };
  });

export const getDailyAnalyticsFn = createServerFn({ method: "GET" }).handler(async () => {
  return getDailyAnalytics();
});
