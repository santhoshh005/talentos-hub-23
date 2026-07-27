import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Sparkles,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Building2,
  GraduationCap,
  Wrench,
  Award,
  FolderGit2,
  BarChart3,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Download,
  Copy,
  Share2,
  ChevronDown,
  Cpu,
  Users,
  DollarSign,
  GitCompareArrows,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeResumeMatch, type ResumeAnalysis } from "@/lib/resume-analyzer.functions";
import { cn } from "@/lib/utils";

type ParsedResume = {
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  currentCompany: string;
  skills: string[];
  education: string;
  projects: string[];
  certifications: string[];
  technologies: string[];
  rawText: string;
};

const mockParsed = (fileName: string): ParsedResume => ({
  name: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  experience: "6 years",
  currentCompany: "Nimbus Labs",
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "GraphQL",
    "AWS",
    "Docker",
    "PostgreSQL",
    "Redis",
  ],
  education: "B.Tech, Computer Science — IIT Hyderabad",
  projects: [
    "Realtime collaboration engine (WebRTC + CRDT)",
    "AI-assisted code review bot (LLM + AST diffing)",
    "Multi-tenant billing platform (Stripe + Postgres RLS)",
  ],
  certifications: ["AWS Solutions Architect Associate", "MongoDB Developer"],
  technologies: ["Next.js", "tRPC", "Kafka", "Terraform (learning)"],
  rawText: `Resume of Aarav Mehta (${fileName}). 6 years experience as full-stack engineer. Currently at Nimbus Labs. Skills: React, TypeScript, Node.js, GraphQL, AWS, Docker, PostgreSQL, Redis. Built realtime collaboration engine, AI code review bot, multi-tenant billing. Education: B.Tech CS IIT Hyderabad.`,
});

type Step = "upload" | "parsing" | "workspace";

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl",
        "shadow-[0_10px_40px_-20px_rgba(2,6,23,0.9)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, delay = 0 }: { value: number; delay?: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
      />
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = useCountUp(score, true, 1600);
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight text-foreground">
          {value}%
        </span>
        <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          Match Score
        </span>
      </div>
    </div>
  );
}

function RadialMini({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  const size = 90;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useCountUp(value, true, 1200 + delay * 200);
  const off = c - (v / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#scoreGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {v}%
        </div>
      </div>
      <span className="text-center text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: "match" | "extra" | "missing";
}) {
  const styles = {
    match: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    extra: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    missing: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  }[variant];
  return (
    <motion.span
      whileHover={{ y: -2, scale: 1.04 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.6)]",
        styles,
      )}
    >
      {label}
    </motion.span>
  );
}

function Collapsible({ title, items, icon: Icon }: { title: string; items: string[]; icon: React.ElementType }) {
  const [open, setOpen] = useState(true);
  return (
    <GlassCard>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {items.map((q, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-muted-foreground"
              >
                <span className="grid h-5 w-5 flex-none place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

export function ResumeAnalyzerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [jd, setJd] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeResumeMatch);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setUploadProgress(0);
    setParsed(null);
    setJd("");
    setAnalysis(null);
    setAnalyzing(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleFile = useCallback((f: File) => {
    const okTypes = [".pdf", ".docx"];
    if (!okTypes.some((t) => f.name.toLowerCase().endsWith(t))) {
      toast.error("Only PDF or DOCX files are supported.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setFile(f);
    setUploadProgress(0);
    const iv = setInterval(() => {
      setUploadProgress((p) => {
        const next = p + Math.random() * 18 + 6;
        if (next >= 100) {
          clearInterval(iv);
          setTimeout(() => {
            setStep("parsing");
            setTimeout(() => {
              setParsed(mockParsed(f.name));
              setStep("workspace");
            }, 1400);
          }, 300);
          return 100;
        }
        return next;
      });
    }, 140);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const runAnalysis = useCallback(async () => {
    if (!parsed || jd.trim().length < 20) {
      toast.error("Paste a Job Description (at least 20 characters).");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyze({
        data: {
          resumeText: parsed.rawText,
          jobDescription: jd,
          candidateName: parsed.name,
        },
      });
      setAnalysis(result);
      toast.success("Analysis complete");
    } catch {
      toast.error("Analysis failed. Showing best-effort results.");
    } finally {
      setAnalyzing(false);
    }
  }, [analyze, jd, parsed]);

  const copyAnalysis = useCallback(() => {
    if (!analysis) return;
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    toast.success("Analysis copied to clipboard");
  }, [analysis]);

  const shareAnalysis = useCallback(async () => {
    if (!analysis) return;
    const text = `TalentOS Resume Analysis\nScore: ${analysis.overallScore}% — ${analysis.verdict}\n\n${analysis.summary}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "TalentOS Analysis", text });
      } catch {
        /* dismissed */
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied");
    }
  }, [analysis]);

  const downloadReport = useCallback(() => {
    if (!analysis || !parsed) return;
    const lines = [
      `TalentOS — Resume Analysis Report`,
      `Candidate: ${parsed.name}`,
      `Overall Match: ${analysis.overallScore}% (${analysis.verdict})`,
      ``,
      `Summary: ${analysis.summary}`,
      ``,
      `Strengths:\n- ${analysis.strengths.join("\n- ")}`,
      ``,
      `Weaknesses:\n- ${analysis.weaknesses.join("\n- ")}`,
      ``,
      `Missing Skills: ${analysis.missingSkills.join(", ")}`,
      ``,
      `Recommendation: ${analysis.hiringRecommendation}`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talentos-analysis-${parsed.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, parsed]);

  const parsedSections = useMemo(() => {
    if (!parsed) return [];
    return [
      { icon: Mail, label: "Email", value: parsed.email },
      { icon: Phone, label: "Phone", value: parsed.phone },
      { icon: MapPin, label: "Location", value: parsed.location },
      { icon: Building2, label: "Current Company", value: parsed.currentCompany },
      { icon: BarChart3, label: "Experience", value: parsed.experience },
      { icon: GraduationCap, label: "Education", value: parsed.education },
    ];
  }, [parsed]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 80, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 80, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden border-l border-white/10 bg-[#020617]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Resume Analyzer
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    AI-powered candidate screening
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === "upload" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center"
                >
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    className={cn(
                      "relative flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all",
                      dragActive
                        ? "border-accent bg-accent/5 shadow-[0_0_60px_-20px_rgba(56,189,248,0.6)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20",
                    )}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-white/10"
                    >
                      <Upload className="h-7 w-7 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Drop your resume here
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Supports PDF and DOCX · Maximum size 10 MB
                    </p>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-transform hover:scale-[1.02]"
                    >
                      <FileText className="h-4 w-4" />
                      Browse Files
                    </button>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                    {file && (
                      <div className="mt-8 w-full">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">{file.name}</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="mt-2">
                          <ProgressBar value={uploadProgress} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "parsing" && (
                <div className="flex h-full flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                  >
                    <Loader2 className="h-10 w-10 text-accent" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Parsing resume with AI…
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Extracting skills, experience, and signals.
                  </p>
                </div>
              )}

              {step === "workspace" && parsed && (
                <div className="mx-auto max-w-5xl space-y-6">
                  {/* Parsed profile */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <GlassCard>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Parsed
                          </span>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                            {parsed.name}
                          </h3>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{file?.name}</div>
                          <div>{((file?.size ?? 0) / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {parsedSections.map(({ icon: Icon, label, value }, i) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                          >
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                              <Icon className="h-3 w-3 text-accent" /> {label}
                            </div>
                            <div className="mt-1 text-sm text-foreground">{value}</div>
                          </motion.div>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <GlassCard>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Wrench className="h-4 w-4 text-accent" /> Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsed.skills.map((s) => (
                          <Chip key={s} label={s} variant="extra" />
                        ))}
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Cpu className="h-4 w-4 text-accent" /> Technologies
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parsed.technologies.map((s) => (
                          <Chip key={s} label={s} variant="extra" />
                        ))}
                      </div>
                    </GlassCard>
                    <GlassCard>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <FolderGit2 className="h-4 w-4 text-accent" /> Projects
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {parsed.projects.map((p) => (
                          <li key={p} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                    <GlassCard>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Award className="h-4 w-4 text-accent" /> Certifications
                      </div>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {parsed.certifications.map((p) => (
                          <li key={p} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </div>

                  {/* JD */}
                  <GlassCard>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-accent" /> Job Description Matching
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {jd.length} characters
                      </span>
                    </div>
                    <textarea
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      placeholder="Paste your Job Description here..."
                      rows={8}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-all hover:scale-[1.02] hover:shadow-[0_25px_70px_-15px] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {analyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {analyzing ? "Analyzing…" : "Analyze Match"}
                      </button>
                    </div>
                  </GlassCard>

                  {analysis && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Score */}
                      <GlassCard>
                        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
                          <div className="flex flex-col items-center">
                            <ScoreCircle score={analysis.overallScore} />
                            <div className="mt-3 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                              {analysis.verdict}
                            </div>
                          </div>
                          <div className="flex-1 space-y-4">
                            {(
                              [
                                ["Technical Skills", analysis.scores.technicalSkills],
                                ["Experience", analysis.scores.experience],
                                ["Education", analysis.scores.education],
                                ["Communication", analysis.scores.communication],
                                ["Culture Fit", analysis.scores.cultureFit],
                              ] as const
                            ).map(([label, v], i) => (
                              <div key={label}>
                                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{label}</span>
                                  <span className="font-medium text-foreground">{v}%</span>
                                </div>
                                <ProgressBar value={v} delay={i * 0.08} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </GlassCard>

                      {/* Skills */}
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold text-emerald-300">
                            Matching Skills
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.matchingSkills.map((s) => (
                              <Chip key={s} label={s} variant="match" />
                            ))}
                          </div>
                        </GlassCard>
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold text-sky-300">
                            Additional Skills
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.additionalSkills.map((s) => (
                              <Chip key={s} label={s} variant="extra" />
                            ))}
                          </div>
                        </GlassCard>
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold text-rose-300">
                            Missing Skills
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missingSkills.map((s) => (
                              <Chip key={s} label={s} variant="missing" />
                            ))}
                          </div>
                        </GlassCard>
                      </div>

                      {/* Insights */}
                      <GlassCard>
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                          <Lightbulb className="h-4 w-4 text-accent" /> AI Insights
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                              Summary
                            </div>
                            <p className="text-sm text-foreground/90">{analysis.summary}</p>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                            <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-emerald-300">
                              <TrendingUp className="h-3 w-3" /> Strengths
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {analysis.strengths.map((s) => (
                                <li key={s}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                            <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-rose-300">
                              <AlertTriangle className="h-3 w-3" /> Weaknesses
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {analysis.weaknesses.map((s) => (
                                <li key={s}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                              Resume Improvements
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {analysis.resumeImprovements.map((s) => (
                                <li key={s}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
                          <div className="mb-1 text-xs uppercase tracking-wider text-accent">
                            Hiring Recommendation
                          </div>
                          <p className="text-sm text-foreground">{analysis.hiringRecommendation}</p>
                        </div>
                      </GlassCard>

                      {/* Interview questions */}
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Collapsible title="Technical" icon={Cpu} items={analysis.interviewQuestions.technical} />
                        <Collapsible title="HR" icon={Users} items={analysis.interviewQuestions.hr} />
                        <Collapsible title="Scenario Based" icon={Sparkles} items={analysis.interviewQuestions.scenario} />
                      </div>

                      {/* Scorecard */}
                      <GlassCard>
                        <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
                          <BarChart3 className="h-4 w-4 text-accent" /> Resume Scorecard
                        </div>
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-7">
                          {(
                            [
                              ["Overall", analysis.scorecard.overallResumeQuality],
                              ["ATS", analysis.scorecard.atsCompatibility],
                              ["Keywords", analysis.scorecard.keywordOptimization],
                              ["Formatting", analysis.scorecard.formatting],
                              ["Experience", analysis.scorecard.experienceQuality],
                              ["Education", analysis.scorecard.education],
                              ["Soft Skills", analysis.scorecard.softSkills],
                            ] as const
                          ).map(([label, v], i) => (
                            <RadialMini key={label} label={label} value={v} delay={i} />
                          ))}
                        </div>
                      </GlassCard>

                      {/* Export */}
                      <GlassCard>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">Export & Share</div>
                            <div className="text-xs text-muted-foreground">
                              Send this analysis to your team.
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={downloadReport}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.08]"
                            >
                              <Download className="h-4 w-4" /> Download Report
                            </button>
                            <button
                              type="button"
                              onClick={copyAnalysis}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.08]"
                            >
                              <Copy className="h-4 w-4" /> Copy Analysis
                            </button>
                            <button
                              type="button"
                              onClick={shareAnalysis}
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-medium text-white hover:scale-[1.02]"
                            >
                              <Share2 className="h-4 w-4" /> Share
                            </button>
                          </div>
                        </div>
                      </GlassCard>

                      {/* Future features */}
                      <div>
                        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                          Coming Soon
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {[
                            { label: "AI Resume Rewrite", icon: Sparkles },
                            { label: "Salary Estimation", icon: DollarSign },
                            { label: "Candidate Ranking", icon: BarChart3 },
                            { label: "Resume Comparison", icon: GitCompareArrows },
                          ].map(({ label, icon: Icon }) => (
                            <div
                              key={label}
                              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 opacity-70"
                            >
                              <Icon className="h-4 w-4 text-accent" />
                              <div className="mt-3 text-sm font-medium">{label}</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Coming Soon
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}