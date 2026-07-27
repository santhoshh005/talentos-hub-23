import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  Users,
  Cpu,
  Target,
  TrendingUp,
  Activity,
  CalendarRange,
  Filter,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/* ---------- KPI ---------- */
const kpiMeta = [
  { key: "positions", base: 12, suffix: "+", label: "Positions Closed", Icon: Briefcase, tint: "from-primary/30 to-transparent", scale: true },
  { key: "candidates", base: 100, suffix: "+", label: "Candidates Screened", Icon: Users, tint: "from-accent/30 to-transparent", scale: true },
  { key: "tech", base: 20, suffix: "+", label: "Technologies Hired", Icon: Cpu, tint: "from-primary/30 to-transparent", scale: false },
  { key: "offer", base: 95, suffix: "%", label: "Offer Success", Icon: Target, tint: "from-accent/30 to-transparent", scale: false },
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
  suffix,
  label,
  Icon,
  tint,
  index,
  inView,
}: {
  value: number;
  suffix: string;
  label: string;
  Icon: typeof Briefcase;
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
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${tint} blur-2xl`} />
      <div className="relative flex items-center justify-between">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Live</span>
      </div>
      <div className="relative mt-5 flex items-baseline gap-1 sm:mt-6">
        <span className="text-4xl font-semibold tracking-tight text-gradient sm:text-5xl">{n}</span>
        <span className="text-xl font-semibold text-accent sm:text-2xl">{suffix}</span>
      </div>
      <p className="relative mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </motion.div>
  );
}

/* ---------- Mock data ---------- */
const ALL_TECHS = ["React", "Node.js", "Python", "Go", "AWS/Cloud", "Data/ML"] as const;
const ALL_SOURCES = ["LinkedIn", "Referrals", "Boolean Search", "Inbound"] as const;
type Tech = (typeof ALL_TECHS)[number];
type Source = (typeof ALL_SOURCES)[number];

const techData: { name: Tech; value: number }[] = [
  { name: "React", value: 28 },
  { name: "Node.js", value: 22 },
  { name: "Python", value: 18 },
  { name: "Go", value: 12 },
  { name: "AWS/Cloud", value: 14 },
  { name: "Data/ML", value: 6 },
];
const funnelData = [
  { stage: "Sourced", count: 420 },
  { stage: "Screened", count: 260 },
  { stage: "Interview", count: 120 },
  { stage: "Offer", count: 32 },
  { stage: "Hired", count: 24 },
];
const sourcesData: { name: Source; value: number }[] = [
  { name: "LinkedIn", value: 46 },
  { name: "Referrals", value: 22 },
  { name: "Boolean Search", value: 18 },
  { name: "Inbound", value: 14 },
];
const trendData = [
  { m: "Jan", hires: 1, pipeline: 8 },
  { m: "Feb", hires: 2, pipeline: 12 },
  { m: "Mar", hires: 1, pipeline: 14 },
  { m: "Apr", hires: 3, pipeline: 18 },
  { m: "May", hires: 2, pipeline: 22 },
  { m: "Jun", hires: 4, pipeline: 28 },
  { m: "Jul", hires: 3, pipeline: 26 },
  { m: "Aug", hires: 5, pipeline: 34 },
];

const RANGES = [
  { key: 3, label: "3M" },
  { key: 6, label: "6M" },
  { key: 8, label: "YTD" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const PIE_COLORS = ["#2563EB", "#38BDF8", "#7C3AED", "#22D3EE", "#3B82F6", "#0EA5E9"];

const tooltipStyle = {
  background: "rgba(15,23,42,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  backdropFilter: "blur(12px)",
} as const;

/* ---------- Chart card ---------- */
function ChartCard({
  title,
  subtitle,
  Icon,
  inView,
  delay,
  children,
}: {
  title: string;
  subtitle: string;
  Icon: typeof Briefcase;
  inView: boolean;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] p-1.5">
              <Icon className="h-3.5 w-3.5 text-accent" />
            </div>
            <h3 className="truncate text-sm font-medium text-foreground">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          Mock
        </span>
      </div>
      <div className="relative mt-4 h-56 w-full sm:h-64 md:h-72">{children}</div>
    </motion.div>
  );
}

/* ---------- Section ---------- */
export function DashboardSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
            A live-feeling view of the hiring engine — pipeline health, sourcing mix,
            and momentum across roles and technologies.
          </p>
        </motion.div>

        {/* KPIs */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} index={i} inView={inView} />
          ))}
        </div>

        {/* Charts */}
        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-2">
          <ChartCard
            title="Technology Distribution"
            subtitle="Hires by primary technology stack"
            Icon={Cpu}
            inView={inView}
            delay={0.15}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="techBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(56,189,248,0.06)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="url(#techBar)" radius={[6, 6, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Hiring Funnel"
            subtitle="Candidates across every stage"
            Icon={Target}
            inView={inView}
            delay={0.25}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="funnelBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip cursor={{ fill: "rgba(56,189,248,0.06)" }} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="url(#funnelBar)" radius={[0, 6, 6, 0]} animationDuration={1400} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Candidate Sources"
            subtitle="Where top candidates come from"
            Icon={Users}
            inView={inView}
            delay={0.35}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Pie
                  data={sourcesData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="rgba(2,6,23,0.6)"
                  animationDuration={1400}
                >
                  {sourcesData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {sourcesData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {s.name}
                  </span>
                  <span className="text-foreground/80">{s.value}%</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Hiring Trend"
            subtitle="Monthly hires and pipeline growth"
            Icon={TrendingUp}
            inView={inView}
            delay={0.45}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="pipelineArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hiresArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="m" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="pipeline" stroke="#38BDF8" strokeWidth={2} fill="url(#pipelineArea)" animationDuration={1400} />
                <Area type="monotone" dataKey="hires" stroke="#2563EB" strokeWidth={2} fill="url(#hiresArea)" animationDuration={1600} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}