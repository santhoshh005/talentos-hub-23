import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Users,
  Cpu,
  Activity,
  FileText,
  TrendingUp,
  Download,
  Zap,
  Target,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useUsageStore, getAverageMatchScore, type ActivityEntry } from "@/lib/usage-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ease = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────── */
/*  Count-up animation                             */
/* ─────────────────────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

/* ─────────────────────────────────────────────── */
/*  KPI Card                                       */
/* ─────────────────────────────────────────────── */
interface KpiCardProps {
  value: number;
  label: string;
  sublabel?: string;
  Icon: React.ElementType;
  gradient: string;
  glowColor: string;
  suffix?: string;
  index: number;
  inView: boolean;
}

function KpiCard({
  value,
  label,
  sublabel,
  Icon,
  gradient,
  glowColor,
  suffix = "",
  index,
  inView,
}: KpiCardProps) {
  const n = useCountUp(value, inView);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl cursor-default"
    >
      {/* Animated background glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0.5, scale: hovered ? 1.15 : 1 }}
        transition={{ duration: 0.4 }}
        className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br ${gradient} blur-3xl`}
      />

      {/* Pulsing ring */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full border ${glowColor}`}
      />

      <div className="relative flex items-center justify-between mb-4">
        <div
          className={`rounded-xl border border-white/10 bg-gradient-to-br ${gradient} p-2.5 shadow-lg`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          Live
        </span>
      </div>

      <div className="relative">
        <div className="flex items-baseline gap-1">
          <motion.span
            className="text-4xl font-bold tracking-tight text-white"
            animate={{ scale: inView ? [1.05, 1] : 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
          >
            {n}
          </motion.span>
          {suffix && <span className="text-lg font-semibold text-white/60">{suffix}</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-white/80">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
      </div>

      {/* Bottom shimmer line */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r ${gradient}`}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Activity Feed                                  */
/* ─────────────────────────────────────────────── */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

const activityConfig: Record<
  ActivityEntry["type"],
  { color: string; bg: string; icon: React.ElementType }
> = {
  analysis: { color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", icon: Users },
  jd: { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: FileText },
  report: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: Download,
  },
};

function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl h-full">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Clock className="h-4 w-4 text-accent" />
          Recent Activity
        </h3>
        <span className="text-xs text-muted-foreground">{entries.length} events</span>
      </div>

      {entries.length === 0 ? (
        <div className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.01]">
          <Activity className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60">
            Start analyzing resumes or generating JDs
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {entries.slice(0, 10).map((entry, i) => {
              const cfg = activityConfig[entry.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 rounded-xl border ${cfg.bg} px-3 py-2.5`}
                >
                  <div className={`rounded-lg border ${cfg.bg} p-1.5`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white/90">{entry.label}</p>
                    {entry.score !== undefined && (
                      <p className="text-[10px] text-muted-foreground">
                        Score:{" "}
                        <span
                          className={
                            entry.score >= 70
                              ? "text-emerald-400"
                              : entry.score >= 40
                                ? "text-amber-400"
                                : "text-rose-400"
                          }
                        >
                          {entry.score}%
                        </span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground/60">
                    {timeAgo(entry.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Skill Cloud                                    */
/* ─────────────────────────────────────────────── */
function SkillCloud({ techs }: { techs: [string, number][] }) {
  const top = techs.sort((a, b) => b[1] - a[1]).slice(0, 20);

  const max = top[0]?.[1] ?? 1;

  const getSize = (count: number) => {
    const ratio = count / max;
    if (ratio > 0.8) return "text-base font-bold";
    if (ratio > 0.5) return "text-sm font-semibold";
    if (ratio > 0.2) return "text-xs font-medium";
    return "text-[11px] font-normal";
  };

  const getColor = (count: number) => {
    const ratio = count / max;
    if (ratio > 0.8) return "text-cyan-300 bg-cyan-500/15 border-cyan-500/30";
    if (ratio > 0.5) return "text-violet-300 bg-violet-500/15 border-violet-500/30";
    if (ratio > 0.2) return "text-blue-300 bg-blue-500/15 border-blue-500/30";
    return "text-muted-foreground bg-white/5 border-white/10";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
        <Target className="h-4 w-4 text-primary" />
        Top Skills Detected
      </h3>
      {top.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-sm text-muted-foreground">Analyze candidates to see skills</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {top.map(([name, count]) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.08 }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${getSize(count)} ${getColor(count)} cursor-default transition-all`}
            >
              {name}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">
                {count}
              </span>
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Score Gauge                                    */
/* ─────────────────────────────────────────────── */
function ScoreGauge({ score, inView }: { score: number; inView: boolean }) {
  const animated = useCountUp(score, inView, 2000);
  const circumference = 2 * Math.PI * 54;
  const dash = (animated / 100) * circumference;

  const color =
    score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : score > 0 ? "#f87171" : "#334155";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: inView ? circumference - dash : circumference }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{animated}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            avg score
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Main Dashboard Section                         */
/* ─────────────────────────────────────────────── */
export function DashboardSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const usage = useUsageStore();

  const techEntries = Object.entries(usage.techStacksDetected);
  const avgScore = getAverageMatchScore();

  const topTechs = [...techEntries]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const kpis: KpiCardProps[] = [
    {
      value: usage.totalCandidates,
      label: "Candidates Analyzed",
      sublabel: "Resume intelligence runs",
      Icon: Users,
      gradient: "from-cyan-500/40 to-blue-600/20",
      glowColor: "border-cyan-500/30",
      index: 0,
      inView,
    },
    {
      value: usage.totalJds,
      label: "JDs Generated",
      sublabel: "Job descriptions created",
      Icon: FileText,
      gradient: "from-violet-500/40 to-purple-600/20",
      glowColor: "border-violet-500/30",
      index: 1,
      inView,
    },
    {
      value: techEntries.length,
      label: "Tech Stacks Detected",
      sublabel: "Unique technologies found",
      Icon: Cpu,
      gradient: "from-blue-500/40 to-indigo-600/20",
      glowColor: "border-blue-500/30",
      index: 2,
      inView,
    },
    {
      value: usage.totalReports,
      label: "Reports Downloaded",
      sublabel: "PDF reports generated",
      Icon: Download,
      gradient: "from-emerald-500/40 to-teal-600/20",
      glowColor: "border-emerald-500/30",
      index: 3,
      inView,
    },
  ];

  return (
    <section ref={ref} className="relative py-20 md:py-32">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header / Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          className="mb-12 glass-panel rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  <Activity className="h-3.5 w-3.5 text-accent" />
                  Live Intelligence Dashboard
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-5xl text-white mb-2">
                Welcome back to TalentOS
              </h1>
              <p className="mt-2 max-w-2xl text-base text-muted-foreground md:text-lg">
                You have {usage.matchScoreCount > 0 ? usage.matchScoreCount : 'new'} matches to review today. Real-time insights from every JD generated and candidate analyzed.
              </p>
            </div>
            <a
              href="/workspace/intelligence"
              className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-[14px] text-sm font-semibold shadow-lg hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all active:scale-95 whitespace-nowrap"
            >
              Review Matches
            </a>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-6">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Main content row */}
        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          {/* Bar Chart — spans 2 cols */}
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Most Detected Tech Stacks
              </h3>
              <span className="text-xs text-muted-foreground">{topTechs.length} tracked</span>
            </div>
            {topTechs.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTechs} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#444"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} dx={-4} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      contentStyle={{
                        backgroundColor: "rgba(9,9,11,0.9)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "13px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#barGrad)"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                      animationDuration={1800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.01]">
                <Cpu className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No tech stacks yet</p>
                <p className="text-xs text-muted-foreground/60">Analyze candidates to see data</p>
              </div>
            )}
          </div>

          {/* Score Gauge + Stats */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
              <Zap className="h-4 w-4 text-amber-400" />
              Match Performance
            </h3>

            <ScoreGauge score={avgScore} inView={inView} />

            <div className="mt-5 space-y-3">
              {[
                { label: "Candidates Scored", value: usage.matchScoreCount, color: "bg-cyan-500" },
                { label: "JDs Created", value: usage.totalJds, color: "bg-violet-500" },
                { label: "Reports Exported", value: usage.totalReports, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                    <span className="truncate text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            {usage.matchScoreCount === 0 && (
              <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Run Resume Intelligence to see your match scores
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Activity Feed + Skill Cloud */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityFeed entries={usage.recentActivity} />
          <SkillCloud techs={techEntries} />
        </div>

        {/* CTA Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 p-6 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h3 className="text-lg font-semibold text-white">Ready to hire smarter?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use AI-powered resume intelligence to find the perfect candidate match.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/workspace/intelligence"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105"
              >
                Run Intelligence
                <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href="/workspace/jd"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10"
              >
                Generate JD
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
