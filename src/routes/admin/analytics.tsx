import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { RefreshCw, AlertTriangle, FileSearch, FileText, Download, Users } from "lucide-react";
import { getDailyAnalyticsFn } from "@/lib/admin.functions";
import { usePolling } from "@/lib/use-polling";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function AdminAnalytics() {
  const getDailyAnalytics = useServerFn(getDailyAnalyticsFn);
  const [days, setDays] = useState<Range>(7);
  const { data, error, loading, refresh } = usePolling(
    () => getDailyAnalytics({ data: { days } }),
    30_000,
    String(days),
  );

  const totals = data?.totals;
  const tiles = [
    { label: "Resumes analyzed", value: totals?.analyses, icon: FileSearch, color: "text-sky-400" },
    { label: "JDs generated", value: totals?.jds, icon: FileText, color: "text-indigo-400" },
    {
      label: "Reports downloaded",
      value: totals?.reports,
      icon: Download,
      color: "text-emerald-400",
    },
    { label: "Active users", value: totals?.activeUsers, icon: Users, color: "text-amber-400" },
  ];
  const hasActivity = !!data && data.series.some((d) => d.analyses + d.jds + d.reports > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Usage</h1>
          <p className="text-sm text-muted-foreground">
            Platform-wide usage for the last {days} days (UTC). Refreshes every 30s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Date range"
            className="flex rounded-xl border border-white/10 bg-white/5 p-1"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  days === r ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground hover:text-white"
            aria-label="Refresh analytics"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <t.icon className={cn("h-4 w-4", t.color)} />
              {t.label}
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-white">
              {t.value ?? (loading ? "…" : 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <h3 className="mb-6 font-semibold text-white">Daily activity</h3>
        <div className="h-[320px]">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  minTickGap={8}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.85)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="analyses" name="Resumes analyzed" stackId="a" fill="#38bdf8" />
                <Bar dataKey="jds" name="JDs generated" stackId="a" fill="#818cf8" />
                <Bar
                  dataKey="reports"
                  name="Reports downloaded"
                  stackId="a"
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {loading && !data ? "Loading activity…" : "No activity recorded in this period."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
