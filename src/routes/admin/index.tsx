import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Gauge,
  FileSearch,
  FileText,
  Download,
} from "lucide-react";
import { getAnalyticsFn } from "@/lib/admin.functions";
import { usePolling } from "@/lib/use-polling";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const getAnalytics = useServerFn(getAnalyticsFn);
  const { data: stats, error, loading } = usePolling(() => getAnalytics(), 30_000);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Could not load platform analytics{error ? `: ${error}` : "."}
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Trial Users",
      value: stats.trialUsers,
      icon: UserPlus,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Blocked Accounts",
      value: stats.blockedUsers,
      icon: ShieldAlert,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
  ];
  const usage = [
    { label: "Resumes analyzed", value: stats.totals.analyses, icon: FileSearch },
    { label: "JDs generated", value: stats.totals.jds, icon: FileText },
    { label: "Reports downloaded", value: stats.totals.reports, icon: Download },
    { label: "Users at ≥80% of quota", value: stats.usersNearLimit, icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">High-level metrics for TalentOS.</p>
      </div>

      {error && (
        <p role="status" className="text-xs text-amber-300">
          Showing last loaded data — refresh failed: {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">All-time usage</h2>
            <Link to="/admin/analytics" className="text-xs text-accent hover:underline">
              View trends →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {usage.map((u) => (
              <div key={u.label} className="rounded-xl bg-white/5 p-4">
                <u.icon className="mb-2 h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold tabular-nums text-white">{u.value}</p>
                <p className="text-xs text-muted-foreground">{u.label}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-white">Top users by usage</h3>
          {stats.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No usage yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topUsers.map((u) => {
                const pct =
                  u.role === "admin" || u.limit <= 0
                    ? null
                    : Math.min(100, Math.round((u.usage / u.limit) * 100));
                return (
                  <li key={u.id} className="flex items-center gap-3 text-sm">
                    <span className="w-32 truncate text-white sm:w-56">{u.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct === null
                            ? "bg-sky-400/60"
                            : pct >= 80
                              ? "bg-rose-400"
                              : "bg-emerald-400",
                        )}
                        style={{ width: `${pct ?? 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right tabular-nums text-muted-foreground">
                      {u.usage}
                      {pct === null ? " · admin" : ` / ${u.limit}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">System Status</h2>
          </div>
          <StatusRow
            ok={stats.health.database}
            label="Supabase database"
            detail={stats.health.database ? "Reachable" : "Unreachable"}
          />
          <StatusRow
            ok={stats.health.aiConfigured}
            label="AI provider (Groq)"
            detail={
              stats.health.aiConfigured
                ? "API key configured"
                : "AI_API_KEY missing — AI features fall back or fail"
            }
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Billing and token spend are tracked in your Groq and Supabase consoles.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          ok ? "bg-emerald-400" : "bg-amber-400",
        )}
        aria-hidden
      />
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
