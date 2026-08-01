import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Cpu, Activity, FileText } from "lucide-react";
import { useUsageStore } from "@/lib/usage-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ease = [0.22, 1, 0.36, 1] as const;

/* ---------- KPI ---------- */
const kpiMeta = [
  {
    key: "jds",
    label: "JDs Analyzed",
    Icon: FileText,
    tint: "from-primary/30 to-transparent",
  },
  {
    key: "candidates",
    label: "Candidates Analyzed",
    Icon: Users,
    tint: "from-accent/30 to-transparent",
  },
  {
    key: "tech",
    label: "Tech Stacks Detected",
    Icon: Cpu,
    tint: "from-primary/30 to-transparent",
  },
] as const;

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

function KpiCard({
  value,
  label,
  Icon,
  tint,
  index,
  inView,
}: {
  value: number;
  label: string;
  Icon: React.ElementType;
  tint: string;
  index: number;
  inView: boolean;
}) {
  const n = useCountUp(value, inView);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${tint} blur-2xl`}
      />
      <div className="relative flex items-center justify-between">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Live</span>
      </div>
      <div className="relative mt-5 flex items-baseline gap-1 sm:mt-6">
        <span className="text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">{n}</span>
      </div>
      <p className="relative mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </motion.div>
  );
}

/* ---------- Section ---------- */
export function DashboardSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const usage = useUsageStore();

  const techEntries = Object.entries(usage.techStacksDetected);

  const kpiValues: Record<string, number> = {
    jds: usage.totalJds,
    candidates: usage.totalCandidates,
    tech: techEntries.length,
  };

  const topTechs = [...techEntries]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const pieData = [
    { name: "JDs", value: usage.totalJds },
    { name: "Candidates", value: usage.totalCandidates },
  ].filter((d) => d.value > 0);

  const COLORS = ["#0284c7", "#4338ca"];

  return (
    <section ref={ref} className="relative py-16 sm:py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Activity className="h-3.5 w-3.5 text-accent" />
            Recruitment Intelligence
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-gradient">Recruitment Intelligence Dashboard</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base md:text-lg">
            A live-feeling view of the hiring engine — tracking the exact volume of analyzed JDs,
            processed candidates, and detected technology stacks.
          </p>
        </motion.div>

        {/* KPIs */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {kpiMeta.map((k, i) => (
            <KpiCard
              key={k.key}
              value={kpiValues[k.key]}
              label={k.label}
              Icon={k.Icon}
              tint={k.tint}
              index={i}
              inView={inView}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Bar Chart - Top Tech Stacks */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-medium text-foreground">
              <Cpu className="h-5 w-5 text-primary" />
              Most Common Tech Stacks Detected
            </h3>
            {topTechs.length > 0 ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTechs} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                      </linearGradient>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                      contentStyle={{
                        backgroundColor: "rgba(9, 9, 11, 0.8)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#38bdf8", fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#colorBar)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-white/5 bg-white/[0.01]">
                <p className="text-sm text-muted-foreground">
                  Analyze candidates to populate data.
                </p>
              </div>
            )}
          </div>

          {/* Pie Chart - AI Usage Split */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-medium text-foreground">
              <Activity className="h-5 w-5 text-accent" />
              AI Activity Breakdown
            </h3>
            {pieData.length > 0 ? (
              <div className="flex h-[320px] w-full flex-col items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">
                      {usage.totalJds + usage.totalCandidates}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Total
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="pie1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="pie2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4338ca" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                      animationDuration={1500}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "url(#pie1)" : "url(#pie2)"}
                          style={{ filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.5))" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "rgba(9, 9, 11, 0.8)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                        color: "#fff",
                      }}
                      itemStyle={{ color: "#fff", fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-center gap-6 text-sm">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-muted-foreground">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          background:
                            i === 0
                              ? "linear-gradient(to right, #38bdf8, #0284c7)"
                              : "linear-gradient(to right, #818cf8, #4338ca)",
                        }}
                      />
                      <span className="font-medium text-foreground/80">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg border border-white/5 bg-white/[0.01]">
                <p className="text-sm text-muted-foreground">Generate JDs or Analyze Resumes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
