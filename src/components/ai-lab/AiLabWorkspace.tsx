import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch,
  FileText,
  SearchCode,
  BarChart3,
  MessageSquareQuote,
  Coins,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResumeAnalyzerModal } from "./ResumeAnalyzerModal";

type TabId =
  | "resume-analyzer"
  | "jd-generator"
  | "match-score"
  | "boolean-search"
  | "interview-ai"
  | "salary-ai";

const tabs: {
  id: TabId;
  label: string;
  icon: React.ElementType;
  status: "live" | "soon";
  tagline: string;
  description: string;
}[] = [
  {
    id: "resume-analyzer",
    label: "Resume Analyzer",
    icon: FileSearch,
    status: "live",
    tagline: "Screen any resume against a JD in seconds.",
    description:
      "Upload a PDF or DOCX, extract structured candidate signals, then match against your Job Description with an explainable AI scorecard.",
  },
  {
    id: "jd-generator",
    label: "JD Generator",
    icon: FileText,
    status: "soon",
    tagline: "Write inclusive, high-signal job descriptions.",
    description:
      "Generate role-specific JDs tuned for top talent — responsibilities, must-haves, nice-to-haves, and inclusive language, in one click.",
  },
  {
    id: "match-score",
    label: "Match Score",
    icon: BarChart3,
    status: "soon",
    tagline: "Rank a batch of candidates against a role.",
    description:
      "Upload multiple resumes and get a ranked leaderboard with explainable scoring across skills, experience, and culture fit.",
  },
  {
    id: "boolean-search",
    label: "Boolean Search",
    icon: SearchCode,
    status: "soon",
    tagline: "Craft powerful sourcing strings.",
    description:
      "Turn a plain-language brief into boolean queries for LinkedIn, GitHub, and niche talent pools — with synonyms and negatives handled.",
  },
  {
    id: "interview-ai",
    label: "Interview AI",
    icon: MessageSquareQuote,
    status: "soon",
    tagline: "Role-specific interview kits, instantly.",
    description:
      "Generate technical, behavioral, and scenario-based questions calibrated to the candidate's level and the role's charter.",
  },
  {
    id: "salary-ai",
    label: "Salary AI",
    icon: Coins,
    status: "soon",
    tagline: "Compensation intelligence, on demand.",
    description:
      "Estimate competitive comp bands by role, seniority, and geography — with market benchmarks and offer-negotiation tips.",
  },
];

export function AiLabWorkspace() {
  const [active, setActive] = useState<TabId>("resume-analyzer");
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const current = tabs.find((t) => t.id === active)!;

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Workspace
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            AI Recruiter Lab
          </h2>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:inline-flex">
          <Sparkles className="h-3 w-3 text-accent" /> Live workspace
        </span>
      </div>

      {/* Tab bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-2 backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-6">
          {tabs.map((t) => {
            const isActive = t.id === active;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(t.id)}
                className={cn(
                  "group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="ai-lab-active-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 ring-1 ring-white/10"
                    transition={{ type: "spring", damping: 26, stiffness: 260 }}
                  />
                )}
                <span className="relative z-10 grid h-6 w-6 place-items-center rounded-md bg-white/[0.04]">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                </span>
                <span className="relative z-10 truncate">{t.label}</span>
                {t.status === "soon" && (
                  <span className="relative z-10 ml-auto hidden text-[9px] uppercase tracking-wider text-muted-foreground lg:inline">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace panel */}
      <div className="mt-6 min-h-[420px] rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium uppercase tracking-wider",
                      current.status === "live"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground",
                    )}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      {current.status === "live" && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                      )}
                      <span
                        className={cn(
                          "relative inline-flex h-1.5 w-1.5 rounded-full",
                          current.status === "live" ? "bg-emerald-400" : "bg-muted-foreground/60",
                        )}
                      />
                    </span>
                    {current.status === "live" ? "Live" : "Coming Soon"}
                  </span>
                </div>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                  {current.label}
                </h3>
                <p className="mt-3 text-base text-muted-foreground">{current.tagline}</p>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground/80">
                  {current.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {current.status === "live" ? (
                    <button
                      type="button"
                      onClick={() => setAnalyzerOpen(true)}
                      className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-all hover:scale-[1.02] hover:shadow-[0_25px_70px_-15px]"
                    >
                      <Sparkles className="h-4 w-4" /> Launch {current.label}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-muted-foreground"
                    >
                      <Lock className="h-4 w-4" /> Coming Soon
                    </button>
                  )}
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative grid h-40 w-40 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-accent/10">
                  <current.icon className="h-14 w-14 text-white/90" strokeWidth={1.4} />
                  <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 opacity-40 blur-2xl" />
                </div>
              </div>
            </div>

            {/* Live preview snapshot for Resume Analyzer */}
            {current.id === "resume-analyzer" && (
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: "Upload", desc: "Drag-drop PDF / DOCX up to 10 MB" },
                  { label: "Parse", desc: "Extract skills, roles, projects, certs" },
                  { label: "Match", desc: "Score against any JD with reasoning" },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span className="grid h-4 w-4 place-items-center rounded bg-gradient-to-br from-primary to-accent text-[9px] font-semibold text-white">
                        {i + 1}
                      </span>
                      Step
                    </div>
                    <div className="mt-2 text-sm font-semibold">{s.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ResumeAnalyzerModal open={analyzerOpen} onClose={() => setAnalyzerOpen(false)} />
    </div>
  );
}