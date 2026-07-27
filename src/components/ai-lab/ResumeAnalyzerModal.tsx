import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { DragEvent, ElementType, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Copy,
  Cpu,
  Download,
  FileText,
  FolderGit2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Share2,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  analyzeResumeMatch,
  parseResume,
  type ParsedResumeData,
  type ResumeAnalysis,
} from "@/lib/resume-analyzer.functions";
import { extractResumeText } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";

type ParsedResume = ParsedResumeData & { rawText: string };
type Step = "upload" | "reading" | "ready";
type ChipVariant = "match" | "extra" | "missing";

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/55 p-5 shadow-2xl shadow-primary/5 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(4, Math.min(100, value))}%` }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
      />
    </div>
  );
}

function Chip({ label, variant = "extra" }: { label: string; variant?: ChipVariant }) {
  const styles: Record<ChipVariant, string> = {
    match: "border-accent/40 bg-accent/10 text-accent",
    extra: "border-primary/40 bg-primary/10 text-primary-foreground",
    missing: "border-destructive/40 bg-destructive/10 text-destructive-foreground",
  };
  return (
    <motion.span whileHover={{ y: -2 }} className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", styles[variant])}>
      {label}
    </motion.span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function DetailCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/35 p-3">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" /> {label}
      </div>
      <div className="mt-1 break-words text-sm text-foreground">{value || "Not found in resume"}</div>
    </div>
  );
}

function ListCard({ icon: Icon, title, items }: { icon: ElementType; title: string; items: string[] }) {
  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={item} label={item} />
          ))}
        </div>
      ) : (
        <EmptyState label="No clear entries found in the uploaded resume." />
      )}
    </GlassCard>
  );
}

function TextListCard({ icon: Icon, title, items }: { icon: ElementType; title: string; items: string[] }) {
  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState label="No clear entries found in the uploaded resume." />
      )}
    </GlassCard>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const id = useId();
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return (
    <div className="relative h-48 w-48">
      <svg viewBox="0 0 192 192" className="h-48 w-48 -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx="96" cy="96" r={radius} className="stroke-muted" strokeWidth="13" fill="none" />
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight">{score}%</span>
        <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Match Score</span>
      </div>
    </div>
  );
}

function Collapsible({ title, items, icon: Icon }: { title: string; items: string[]; icon: ElementType }) {
  const [open, setOpen] = useState(true);
  return (
    <GlassCard>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-accent" /> {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2 overflow-hidden text-sm text-muted-foreground"
          >
            {items.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded-xl border border-border bg-background/35 p-3">
                {item}
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
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for resume upload");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [jdMode, setJdMode] = useState<"paste" | "upload">("paste");
  const [jdFileName, setJdFileName] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const parseResumeFn = useServerFn(parseResume);
  const analyzeResumeFn = useServerFn(analyzeResumeMatch);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setStep("upload");
    setFile(null);
    setProgress(0);
    setStatus("Waiting for resume upload");
    setDragActive(false);
    setError("");
    setParsed(null);
    setJobDescription("");
    setAnalysis(null);
    setAnalyzing(false);
    setAnalyzeProgress(0);
    setAnalyzeStatus("");
    setJdMode("paste");
    setJdFileName("");
    setJdLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (jdInputRef.current) jdInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const parsedFields = useMemo(
    () => [
      { icon: Mail, label: "Email", value: parsed?.email ?? "" },
      { icon: Phone, label: "Phone", value: parsed?.phone ?? "" },
      { icon: MapPin, label: "Location", value: parsed?.location ?? "" },
      { icon: Building2, label: "Current Company", value: parsed?.currentCompany ?? "" },
      { icon: BarChart3, label: "Experience", value: parsed?.experience ?? "" },
      { icon: GraduationCap, label: "Education", value: parsed?.education ?? "" },
    ],
    [parsed],
  );

  const processFile = useCallback(
    async (nextFile: File) => {
      const lowerName = nextFile.name.toLowerCase();
      if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
        toast.error("Upload a PDF or DOCX resume.");
        return;
      }
      if (nextFile.size > 10 * 1024 * 1024) {
        toast.error("Resume file must be under 10 MB.");
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      let progressTimer: ReturnType<typeof setInterval> | undefined;

      setFile(nextFile);
      setStep("reading");
      setProgress(8);
      setStatus("Reading uploaded file");
      setError("");
      setParsed(null);
      setAnalysis(null);

      progressTimer = setInterval(() => {
        setProgress((value) => Math.min(88, value + 5));
      }, 300);

      try {
        const rawText = await extractResumeText(nextFile);
        if (requestIdRef.current !== requestId) return;
        setProgress(55);
        setStatus("Extracting exact resume details");

        const structured = await parseResumeFn({ data: { resumeText: rawText } });
        if (requestIdRef.current !== requestId) return;

        setParsed({ ...structured, rawText });
        setProgress(100);
        setStatus("Resume parsed successfully");
        setStep("ready");
        toast.success("Resume parsed from uploaded file");
      } catch (caught) {
        if (requestIdRef.current !== requestId) return;
        const message = caught instanceof Error ? caught.message : "Failed to parse this resume.";
        console.error("[TalentOS Resume Analyzer] upload pipeline failed:", caught);
        setError(message);
        setStep("upload");
        setProgress(0);
        toast.error(message);
      } finally {
        if (progressTimer) clearInterval(progressTimer);
      }
    },
    [parseResumeFn],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const droppedFile = event.dataTransfer.files?.[0];
      if (droppedFile) void processFile(droppedFile);
    },
    [processFile],
  );

  const runAnalysis = useCallback(async () => {
    if (!parsed) return;
    if (jobDescription.trim().length < 20) {
      toast.error("Paste a Job Description with at least 20 characters.");
      return;
    }
    setAnalyzing(true);
    setAnalyzeProgress(6);
    setAnalyzeStatus("Reading job description");
    const steps = [
      { at: 22, label: "Matching skills & keywords" },
      { at: 44, label: "Scoring experience & education" },
      { at: 66, label: "Generating recruiter insights" },
      { at: 84, label: "Preparing interview questions" },
    ];
    let stepIndex = 0;
    const timer = setInterval(() => {
      setAnalyzeProgress((value) => {
        const next = Math.min(92, value + 4);
        if (stepIndex < steps.length && next >= steps[stepIndex].at) {
          setAnalyzeStatus(steps[stepIndex].label);
          stepIndex += 1;
        }
        return next;
      });
    }, 220);
    try {
      const result = await analyzeResumeFn({
        data: {
          resumeText: parsed.rawText,
          jobDescription,
          candidateName: parsed.name,
        },
      });
      setAnalysis(result);
      setAnalyzeProgress(100);
      setAnalyzeStatus("Analysis ready");
      toast.success("Match analysis complete");
    } catch (caught) {
      console.error("[TalentOS Resume Analyzer] match failed:", caught);
      toast.error("Analysis failed. Please try again.");
    } finally {
      clearInterval(timer);
      setAnalyzing(false);
    }
  }, [analyzeResumeFn, jobDescription, parsed]);

  const processJdFile = useCallback(async (nextFile: File) => {
    const lowerName = nextFile.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx") && !lowerName.endsWith(".txt")) {
      toast.error("Upload a PDF, DOCX, or TXT job description.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      toast.error("JD file must be under 10 MB.");
      return;
    }
    setJdLoading(true);
    setJdFileName(nextFile.name);
    try {
      const text = lowerName.endsWith(".txt")
        ? await nextFile.text()
        : await extractResumeText(nextFile);
      setJobDescription(text.trim());
      toast.success("Job description loaded");
    } catch (caught) {
      console.error("[TalentOS Resume Analyzer] JD extraction failed:", caught);
      toast.error("Could not read that job description file.");
    } finally {
      setJdLoading(false);
    }
  }, []);

  const reportText = useMemo(() => {
    if (!parsed) return "";
    const lines = [
      "TalentOS — Resume Analyzer Report",
      `Candidate: ${parsed.name || "Not found"}`,
      `Email: ${parsed.email || "Not found"}`,
      `Phone: ${parsed.phone || "Not found"}`,
      `Education: ${parsed.education || "Not found"}`,
      `Skills: ${parsed.skills.join(", ") || "Not found"}`,
      `Technologies: ${parsed.technologies.join(", ") || "Not found"}`,
    ];
    if (analysis) {
      lines.push("", `Match Score: ${analysis.overallScore}%`, `Verdict: ${analysis.verdict}`, `Summary: ${analysis.summary}`);
    }
    return lines.join("\n");
  }, [analysis, parsed]);

  const copyReport = useCallback(() => {
    if (!reportText) return;
    void navigator.clipboard?.writeText(reportText);
    toast.success("Report copied");
  }, [reportText]);

  const downloadReport = useCallback(() => {
    if (!reportText || !parsed) return;
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const candidate = (parsed.name || "candidate").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    link.href = url;
    link.download = `talentos-resume-analysis-${candidate || "candidate"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [parsed, reportText]);

  const shareReport = useCallback(async () => {
    if (!reportText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "TalentOS Resume Analysis", text: reportText });
        return;
      } catch {
        return;
      }
    }
    void navigator.clipboard?.writeText(reportText);
    toast.success("Share text copied");
  }, [reportText]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-stretch justify-end bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 96, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 96, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 250 }}
            className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden border-l border-border bg-background"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute bottom-16 left-12 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <header className="relative z-10 flex items-center justify-between border-b border-border bg-card/40 px-5 py-4 backdrop-blur-xl md:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight md:text-base">Resume Analyzer</h2>
                  <p className="text-xs text-muted-foreground">Real extraction from your uploaded PDF or DOCX</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Close resume analyzer" onClick={onClose} className="border-border bg-background/40">
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-6">
              {step === "upload" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex min-h-full max-w-3xl flex-col justify-center">
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={onDrop}
                    className={cn(
                      "relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center shadow-2xl backdrop-blur-xl transition-all md:p-12",
                      dragActive ? "border-accent bg-accent/10 shadow-accent/10" : "border-border bg-card/45 hover:border-accent/50",
                    )}
                  >
                    <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-primary/25 to-accent/15 ring-1 ring-border">
                      <Upload className="h-8 w-8 text-accent" />
                    </motion.div>
                    <h3 className="text-2xl font-semibold tracking-tight">Upload the actual resume</h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                      TalentOS reads the uploaded PDF/DOCX, extracts embedded text, then structures only details found in that resume.
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Button type="button" onClick={() => inputRef.current?.click()} className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 shadow-xl shadow-primary/25">
                        <FileText className="h-4 w-4" /> Browse Files
                      </Button>
                      <Button type="button" variant="outline" onClick={reset} className="rounded-xl border-border bg-background/30">
                        <RotateCcw className="h-4 w-4" /> Reset
                      </Button>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      aria-label="Upload resume"
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0];
                        event.target.value = "";
                        if (selectedFile) void processFile(selectedFile);
                      }}
                    />
                    <p className="mt-5 text-xs text-muted-foreground">PDF or DOCX · Up to 10 MB · Text-based resumes parse best</p>
                    {error && (
                      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left text-sm text-destructive-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "reading" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex min-h-full max-w-2xl flex-col justify-center">
                  <GlassCard className="text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10">
                      <Loader2 className="h-8 w-8 text-accent" />
                    </motion.div>
                    <h3 className="text-xl font-semibold tracking-tight">Parsing your resume</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{status}</p>
                    <div className="mt-6 text-left">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{file?.name}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {step === "ready" && parsed && (
                <div className="mx-auto max-w-5xl space-y-6">
                  <GlassCard>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-accent">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Parsed from uploaded file
                        </span>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight">{parsed.name || "Candidate profile"}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB · {parsed.rawText.length.toLocaleString()} extracted characters</p>
                      </div>
                      <Button type="button" variant="outline" onClick={reset} className="rounded-xl border-border bg-background/35">
                        <RotateCcw className="h-4 w-4" /> Upload another
                      </Button>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {parsedFields.map((field) => (
                        <DetailCard key={field.label} {...field} />
                      ))}
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ListCard icon={Wrench} title="Skills" items={parsed.skills} />
                    <ListCard icon={Cpu} title="Technologies" items={parsed.technologies} />
                    <TextListCard icon={FolderGit2} title="Projects" items={parsed.projects} />
                    <TextListCard icon={Award} title="Certifications" items={parsed.certifications} />
                  </div>

                  <GlassCard>
                    <details>
                      <summary className="cursor-pointer text-sm font-semibold text-foreground">Extracted resume text</summary>
                      <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-background/50 p-4 text-xs leading-5 text-muted-foreground">
                        {parsed.rawText}
                      </pre>
                    </details>
                  </GlassCard>

                  <GlassCard>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-accent" /> Job Description Matching
                      </div>
                      <span className="text-xs text-muted-foreground">{jobDescription.length} characters</span>
                    </div>
                    <div className="mb-3 inline-flex rounded-xl border border-border bg-background/40 p-1 text-xs">
                      {(["paste", "upload"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setJdMode(mode)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 font-medium capitalize transition",
                            jdMode === mode
                              ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {mode === "paste" ? "Paste JD" : "Upload JD"}
                        </button>
                      ))}
                    </div>
                    {jdMode === "paste" ? (
                      <textarea
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Paste the Job Description here to compare it with this exact resume..."
                        rows={8}
                        className="w-full resize-y rounded-2xl border border-border bg-background/50 p-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/30"
                      />
                    ) : (
                      <div className="space-y-3">
                        <div
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const dropped = event.dataTransfer.files?.[0];
                            if (dropped) void processJdFile(dropped);
                          }}
                          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background/40 p-6 text-center transition hover:border-accent/50"
                        >
                          {jdLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-accent" />
                          ) : (
                            <Upload className="h-6 w-6 text-accent" />
                          )}
                          <div className="text-sm text-muted-foreground">
                            {jdFileName ? (
                              <>Loaded <span className="text-foreground">{jdFileName}</span></>
                            ) : (
                              "Drop a PDF, DOCX, or TXT job description here"
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => jdInputRef.current?.click()}
                            className="rounded-xl border-border bg-background/40"
                          >
                            <FileText className="h-4 w-4" /> Choose JD file
                          </Button>
                          <input
                            ref={jdInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            aria-label="Upload job description"
                            onChange={(event) => {
                              const selected = event.target.files?.[0];
                              event.target.value = "";
                              if (selected) void processJdFile(selected);
                            }}
                          />
                        </div>
                        {jobDescription && (
                          <details className="rounded-2xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                            <summary className="cursor-pointer text-foreground">Preview extracted JD text</summary>
                            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap leading-5">{jobDescription}</pre>
                          </details>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <Button type="button" onClick={runAnalysis} disabled={analyzing} className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 shadow-xl shadow-primary/25">
                        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {analyzing ? "Analyzing…" : "Analyze Match"}
                      </Button>
                    </div>
                    {analyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 rounded-2xl border border-border bg-background/50 p-4"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div className="relative h-9 w-9">
                            <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
                            <div className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
                              <Sparkles className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{analyzeStatus || "Analyzing your match"}</div>
                            <div className="text-xs text-muted-foreground">TalentOS AI is comparing the resume against the JD…</div>
                          </div>
                          <div className="text-xs tabular-nums text-muted-foreground">{Math.round(analyzeProgress)}%</div>
                        </div>
                        <ProgressBar value={analyzeProgress} />
                        <div className="mt-3 flex gap-1.5 overflow-hidden">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <motion.span
                              key={i}
                              className="h-1 flex-1 rounded-full bg-accent/40"
                              animate={{ opacity: [0.2, 1, 0.2] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.06 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>

                  {analysis && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <GlassCard>
                        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
                          <div className="flex justify-center">
                            <ScoreCircle score={analysis.overallScore} />
                          </div>
                          <div>
                            <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                              {analysis.verdict}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
                            <div className="mt-5 space-y-3">
                              {(
                                [
                                  ["Technical Skills", analysis.scores.technicalSkills],
                                  ["Experience", analysis.scores.experience],
                                  ["Education", analysis.scores.education],
                                  ["Communication", analysis.scores.communication],
                                  ["Culture Fit", analysis.scores.cultureFit],
                                ] as const
                              ).map(([label, value]) => (
                                <div key={label}>
                                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                    <span>{label}</span>
                                    <span>{value}%</span>
                                  </div>
                                  <ProgressBar value={value} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </GlassCard>

                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold text-accent">Matching Skills</div>
                          <div className="flex flex-wrap gap-2">{analysis.matchingSkills.map((skill) => <Chip key={skill} label={skill} variant="match" />)}</div>
                        </GlassCard>
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold">Additional Skills</div>
                          <div className="flex flex-wrap gap-2">{analysis.additionalSkills.map((skill) => <Chip key={skill} label={skill} variant="extra" />)}</div>
                        </GlassCard>
                        <GlassCard>
                          <div className="mb-3 text-sm font-semibold text-destructive-foreground">Missing JD Signals</div>
                          <div className="flex flex-wrap gap-2">{analysis.missingSkills.map((skill) => <Chip key={skill} label={skill} variant="missing" />)}</div>
                        </GlassCard>
                      </div>

                      <GlassCard>
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                          <TrendingUp className="h-4 w-4 text-accent" /> Recruiter Insights
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                          <TextListCard icon={CheckCircle2} title="Strengths" items={analysis.strengths} />
                          <TextListCard icon={AlertTriangle} title="Gaps" items={analysis.weaknesses} />
                          <TextListCard icon={Sparkles} title="Resume Improvements" items={analysis.resumeImprovements} />
                        </div>
                        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                          <div className="text-xs font-medium uppercase tracking-widest text-accent">Hiring Recommendation</div>
                          <p className="mt-1 text-sm text-foreground">{analysis.hiringRecommendation}</p>
                        </div>
                      </GlassCard>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Collapsible title="Technical Questions" icon={Cpu} items={analysis.interviewQuestions.technical} />
                        <Collapsible title="HR Questions" icon={Users} items={analysis.interviewQuestions.hr} />
                        <Collapsible title="Scenario Questions" icon={Sparkles} items={analysis.interviewQuestions.scenario} />
                      </div>
                    </motion.div>
                  )}

                  <GlassCard>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold">Export parsed results</div>
                        <div className="text-xs text-muted-foreground">Copy, download, or share the extracted resume details.</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={downloadReport} className="rounded-xl border-border bg-background/35">
                          <Download className="h-4 w-4" /> Download
                        </Button>
                        <Button type="button" variant="outline" onClick={copyReport} className="rounded-xl border-border bg-background/35">
                          <Copy className="h-4 w-4" /> Copy
                        </Button>
                        <Button type="button" onClick={shareReport} className="rounded-xl bg-gradient-to-r from-primary to-accent">
                          <Share2 className="h-4 w-4" /> Share
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}