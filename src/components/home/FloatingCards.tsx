import { motion } from "framer-motion";
import {
  FileText,
  Wand2,
  Users,
  Search,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Card = {
  title: string;
  icon: LucideIcon;
  accent: string;
  className: string;
  delay: number;
  float: number;
  body: React.ReactNode;
};

const cards: Card[] = [
  {
    title: "Resume Analyzer",
    icon: FileText,
    accent: "from-primary/40 to-accent/20",
    className: "top-0 left-2 w-[62%] rotate-[-4deg]",
    delay: 0.05,
    float: 8,
    body: (
      <div className="mt-3 space-y-1.5">
        {[
          ["React · 6y", 92],
          ["TypeScript", 88],
          ["System Design", 74],
        ].map(([label, pct]) => (
          <div key={label as string} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{label}</span>
              <span className="text-accent">{pct}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "JD Generator",
    icon: Wand2,
    accent: "from-accent/40 to-primary/20",
    className: "top-8 right-0 w-[52%] rotate-[5deg]",
    delay: 0.15,
    float: 10,
    body: (
      <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>Senior AI Engineer</span>
        </div>
        <div className="h-1.5 w-full rounded bg-white/[0.06]" />
        <div className="h-1.5 w-[85%] rounded bg-white/[0.06]" />
        <div className="h-1.5 w-[70%] rounded bg-white/[0.06]" />
        <div className="h-1.5 w-[55%] rounded bg-white/[0.06]" />
      </div>
    ),
  },
  {
    title: "Candidate Match",
    icon: Users,
    accent: "from-primary/40 to-accent/30",
    className: "top-[46%] left-0 w-[50%] rotate-[3deg]",
    delay: 0.25,
    float: 12,
    body: (
      <div className="mt-3 space-y-1.5">
        {[
          ["Priya S.", 96],
          ["Marcus L.", 91],
          ["Aiko T.", 87],
        ].map(([name, score]) => (
          <div
            key={name as string}
            className="flex items-center justify-between rounded-md bg-white/[0.03] px-1.5 py-1 text-[10px]"
          >
            <div className="flex items-center gap-1.5">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-[8px] font-semibold text-white">
                {(name as string).charAt(0)}
              </span>
              <span className="text-foreground/80">{name}</span>
            </div>
            <span className="font-medium text-accent">{score}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Boolean Search",
    icon: Search,
    accent: "from-accent/40 to-primary/20",
    className: "top-[52%] right-4 w-[54%] rotate-[-3deg]",
    delay: 0.35,
    float: 9,
    body: (
      <div className="mt-3 rounded-md border border-white/5 bg-black/40 p-2 font-mono text-[9.5px] leading-relaxed text-muted-foreground">
        <span className="text-accent">(</span>"React" <span className="text-primary">OR</span> "Next.js"
        <span className="text-accent">)</span> <span className="text-primary">AND</span>{" "}
        "TypeScript" <span className="text-primary">AND NOT</span> "junior"
      </div>
    ),
  },
  {
    title: "Interview Generator",
    icon: MessageSquare,
    accent: "from-primary/40 to-accent/30",
    className: "bottom-0 left-[24%] w-[56%] rotate-[-2deg]",
    delay: 0.45,
    float: 11,
    body: (
      <div className="mt-3 space-y-1.5 text-[10px]">
        {[
          "Explain event loop internals",
          "Design a rate limiter",
          "Trade-offs: SQL vs NoSQL",
        ].map((q) => (
          <div key={q} className="flex items-start gap-1.5 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3 w-3 flex-none text-accent" />
            <span>{q}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function FloatingCards() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
      {/* Backdrop glow disc */}
      <div className="absolute inset-8 rounded-[40%] bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
      <div className="absolute inset-16 rounded-full border border-white/5" />
      <div className="absolute inset-24 rounded-full border border-white/[0.03]" />

      {cards.map((c) => (
        <motion.div
          key={c.title}
          className={`absolute ${c.className}`}
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.7,
            delay: c.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <motion.div
            animate={{ y: [0, -c.float, 0] }}
            transition={{
              duration: 6 + c.float * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: c.delay,
            }}
            whileHover={{ scale: 1.04, rotate: 0 }}
            className="glass-panel rounded-2xl p-3.5 shadow-[0_20px_60px_-20px_rgba(2,6,23,0.9)] ring-1 ring-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <div
                className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${c.accent} ring-1 ring-white/10`}
              >
                <c.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="text-[11px] font-medium tracking-tight text-foreground">
                {c.title}
              </div>
              <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
            </div>
            {c.body}
          </motion.div>
        </motion.div>
      ))}

      {/* Connective lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.555 0.22 264)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 220)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 25 15 Q 50 45 78 20"
          fill="none"
          stroke="url(#line)"
          strokeWidth="0.25"
        />
        <path
          d="M 20 55 Q 50 70 80 60"
          fill="none"
          stroke="url(#line)"
          strokeWidth="0.25"
        />
        <path
          d="M 40 90 Q 55 60 82 55"
          fill="none"
          stroke="url(#line)"
          strokeWidth="0.25"
        />
      </svg>
    </div>
  );
}