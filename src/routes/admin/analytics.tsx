import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDailyAnalyticsFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

// Remove mockData

function AdminAnalytics() {
  const getDailyAnalytics = useServerFn(getDailyAnalyticsFn);
  const [data, setData] = useState<any[]>([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const result = await getDailyAnalytics();
      setData(result);
    } catch (e) {
      console.error(e);
    }
  }, [getDailyAnalytics]);

  useEffect(() => {
    void fetchAnalytics();

    // Poll every 10 seconds to keep the dashboard live
    const interval = setInterval(() => {
      void fetchAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAnalytics]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Usage</h1>
        <p className="text-sm text-muted-foreground">Platform-wide usage metrics.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-6 font-semibold text-white">Platform Activity (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="analyses"
                  name="Resumes Analyzed"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="jds" name="JDs Generated" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <h3 className="mb-6 font-semibold text-white">Cost Estimation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Groq AI Calls</p>
                <p className="text-xs text-muted-foreground">Estimated token usage cost</p>
              </div>
              <p className="text-xl font-bold text-emerald-400">$0.00</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Supabase Database</p>
                <p className="text-xs text-muted-foreground">Monthly active tier</p>
              </div>
              <p className="text-xl font-bold text-emerald-400">Free Tier</p>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Detailed billing is handled through your respective Groq and Supabase accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
