import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Users, UserCheck, UserPlus, Activity, ShieldAlert } from "lucide-react";
import { getAnalyticsFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const getAnalytics = useServerFn(getAnalyticsFn);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    trialUsers: number;
    blockedUsers: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const data = await getAnalytics();
        if (mounted) setStats(data);
      } catch (err) {
        console.error("Failed to fetch platform analytics:", err);
      }
    };
    
    void fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll every 10 seconds
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [getAnalytics]);

  if (!stats) return <div className="animate-pulse">Loading analytics...</div>;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">High-level metrics for TalentOS.</p>
      </div>

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
            <p className="text-3xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">System Status</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-sm text-white">All systems operational</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Supabase DB and AI Gateway are healthy.
        </p>
      </div>
    </div>
  );
}
