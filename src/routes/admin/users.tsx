import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useCallback } from "react";
import {
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  listUsersFn,
  toggleAccessFn,
  updateSubscriptionFn,
  setRoleFn,
  softDeleteUserFn,
} from "@/lib/admin.functions";
import type { Profile } from "@/lib/supabase-types";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const listUsers = useServerFn(listUsersFn);
  const toggleAccess = useServerFn(toggleAccessFn);
  const updateSub = useServerFn(updateSubscriptionFn);
  const setRole = useServerFn(setRoleFn);
  const softDeleteUser = useServerFn(softDeleteUserFn);

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await listUsers();
    setUsers(data);
    setLoading(false);
  }, [listUsers]);

  useEffect(() => {
    void fetchUsers();

    // Poll every 10 seconds to keep the dashboard live
    const interval = setInterval(() => {
      void fetchUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchUsers]);

  const handleToggleAccess = async (userId: string, current: boolean) => {
    await toggleAccess({ data: { userId, isActive: !current } });
    await fetchUsers();
  };

  const handleSetRole = async (userId: string, current: "user" | "admin") => {
    const newRole = current === "admin" ? "user" : "admin";
    await setRole({ data: { userId, role: newRole } });
    await fetchUsers();
  };

  const handleUpdateSub = async (
    userId: string,
    status: "trial" | "active" | "expired" | "blocked",
  ) => {
    await updateSub({ data: { userId, status } });
    await fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This will clear their data and permanently suspend them.",
      )
    ) {
      await softDeleteUser({ data: { userId } });
      await fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts, roles, and subscriptions.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
        <table className="w-full text-left text-sm text-white">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Subscription</th>
              <th className="px-6 py-4 font-medium">Usage</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        user.role === "admin"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-muted-foreground border border-white/10"
                      }`}
                    >
                      {user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : null}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span>{user.is_active ? "Active" : "Suspended"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.subscription_status}
                      onChange={(e) => void handleUpdateSub(user.id, e.target.value as any)}
                      className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:border-accent focus:outline-none"
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-white">
                      {user.usage_count}{" "}
                      <span className="text-xs text-muted-foreground">Generations</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => void handleToggleAccess(user.id, user.is_active)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          user.is_active
                            ? "text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400"
                            : "text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-400"
                        }`}
                        title={user.is_active ? "Suspend User" : "Activate User"}
                      >
                        {user.is_active ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => void handleSetRole(user.id, user.role)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                        title={user.role === "admin" ? "Demote to User" : "Promote to Admin"}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void handleDeleteUser(user.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
