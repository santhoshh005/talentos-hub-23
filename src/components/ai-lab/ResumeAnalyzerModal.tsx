import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runResumeIntelligence } from "@/lib/pipeline.functions";
import { extractResumeText } from "@/lib/resume-extract";
import { setResult } from "@/lib/report-store";
import { clearIntake, setIntake, useIntake } from "@/lib/intake-store";
import { trackCandidateAnalysis, trackJdAnalysis } from "@/lib/usage-store";
import { cn } from "@/lib/utils";

type Phase = "intake" | "running" | "error";

const LOADING_STEPS = [
  { key: "upload", label: "Resume Uploaded" },
  { key: "resumeParser", label: "Parsing Resume" },
  { key: "jdIntelligence", label: "Understanding Job Description" },
  { key: "skillNormalization", label: "Normalizing Skills" },
  { key: "matching", label: "Matching Skills" },
  { key: "evidence", label: "Analyzing Evidence" },
  { key: "report", label: "Preparing Report" },
] as const;

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl transition-all hover:bg-white/[0.04]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ResumeAnalyzerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const runPipeline = useServerFn(runResumeIntelligence);
  const intake = useIntake();

  const [phase, setPhase] = useState<Phase>("intake");
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resumeText = intake.resumeText;
  const resumeName = intake.resumeName;
  const jobDescription = intake.jobDescription;
  const jdMode = intake.jdMode;
  const jdFileName = intake.jdFileName;

  const clearTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearTimer();
    setPhase("intake");
    setExtracting(false);
    setDragActive(false);
    setJdLoading(false);
    setActiveStep(0);
    setErrorMessage("");
    setFailedStage(null);
    clearIntake();
    if (inputRef.current) inputRef.current.value = "";
    if (jdInputRef.current) jdInputRef.current.value = "";
  }, []);

  // Cleanup only — never wipe intake on close so users can navigate to
  // other workspace tabs and come back without losing their resume + JD.
  useEffect(() => () => clearTimer(), []);
  useEffect(() => {
    if (open) {
      // Return the user to the intake step when they reopen the drawer,
      // unless a run is already in flight or errored.
      setPhase((p) => (p === "running" ? p : "intake"));
      setErrorMessage("");
      setFailedStage(null);
    }
  }, [open]);

  const processResumeFile = useCallback(async (nextFile: File) => {
    const lower = nextFile.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      toast.error("Upload a PDF or DOCX resume.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      toast.error("Resume file must be under 10 MB.");
      return;
    }
    setExtracting(true);
    setIntake({ resumeName: nextFile.name, resumeText: "" });
    try {
      const text = await extractResumeText(nextFile);
      setIntake({ resumeText: text });
      toast.success("Resume ready");
    } catch (caught) {
      console.error("[TalentOS Resume Analyzer] resume extract failed:", caught);
      toast.error("Could not read that resume file.");
      setIntake({ resumeName: "", resumeText: "" });
    } finally {
      setExtracting(false);
    }
  }, []);

  const onDropResume = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) void processResumeFile(dropped);
    },
    [processResumeFile],
  );

  const processJdFile = useCallback(async (nextFile: File) => {
    const lower = nextFile.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx") && !lower.endsWith(".txt")) {
      toast.error("Upload a PDF, DOCX, or TXT job description.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      toast.error("JD file must be under 10 MB.");
      return;
    }
    setJdLoading(true);
    setIntake({ jdFileName: nextFile.name });
    try {
      const text = lower.endsWith(".txt")
        ? await nextFile.text()
        : await extractResumeText(nextFile);
      setIntake({ jobDescription: text.trim() });
      trackJdAnalysis();
      toast.success("Job description loaded");
    } catch (caught) {
      console.error("[TalentOS Resume Analyzer] JD extraction failed:", caught);
      toast.error("Could not read that job description file.");
    } finally {
      setJdLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!resumeText || resumeText.trim().length < 20) {
      toast.error("Upload a resume first.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      toast.error("Paste a Job Description with at least 20 characters.");
      return;
    }

    setPhase("running");
    setErrorMessage("");
    setFailedStage(null);
    setActiveStep(1);

    clearTimer();
    stepTimerRef.current = setInterval(() => {
      setActiveStep((s) => (s < LOADING_STEPS.length - 2 ? s + 1 : s));
    }, 900);

    try {
      const output = await runPipeline({ data: { resumeText, jobDescription } });
      clearTimer();
      if (output.ok) {
        setActiveStep(LOADING_STEPS.length - 1);
        setResult(output);
        const matchScore = output.scoring?.matchPercentage ?? undefined;
        trackCandidateAnalysis(output.resume?.technologies || [], matchScore);
        // brief hold so the last step visibly illuminates, then navigate
        setTimeout(() => {
          onClose();
          navigate({ to: "/report" });
        }, 400);
      } else {
        setFailedStage(String(output.failedStage));
        setErrorMessage(output.error.message);
        setPhase("error");
      }
    } catch (caught) {
      clearTimer();
      const message = caught instanceof Error ? caught.message : "Pipeline call failed.";
      console.error("[TalentOS Resume Analyzer] pipeline failed:", caught);
      setErrorMessage(message);
      setPhase("error");
    }
  }, [jobDescription, navigate, onClose, resumeText, runPipeline]);

  const retry = useCallback(() => {
    setErrorMessage("");
    setFailedStage(null);
    setPhase("intake");
  }, []);

  const ready = !!resumeText && !extracting && jobDescription.trim().length >= 20;

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
            className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-border bg-background"
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
                  <h2 className="text-sm font-semibold tracking-tight md:text-base">
                    Resume Analyzer
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Upload a resume + JD to run the Resume Intelligence Pipeline
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Close resume analyzer"
                onClick={onClose}
                className="border-border bg-background/40"
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-6">
              {phase === "intake" && (
                <motion.div
                  key="intake"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto max-w-2xl space-y-5"
                >
                  <GlassCard>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Upload className="h-4 w-4 text-accent" /> Resume
                    </div>
                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={onDropResume}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                        dragActive
                          ? "border-accent bg-accent/10"
                          : "border-border bg-background/40 hover:border-accent/50",
                      )}
                    >
                      {extracting ? (
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                      ) : resumeName ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <Upload className="h-6 w-6 text-accent" />
                      )}
                      <div className="text-sm text-muted-foreground">
                        {resumeName ? (
                          <>
                            Loaded <span className="text-foreground">{resumeName}</span>
                          </>
                        ) : (
                          "Drop a PDF or DOCX resume here"
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => inputRef.current?.click()}
                        className="rounded-xl border-border bg-background/40"
                      >
                        <FileText className="h-4 w-4" /> Choose resume file
                      </Button>
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        aria-label="Upload resume"
                        onChange={(event) => {
                          const selected = event.target.files?.[0];
                          event.target.value = "";
                          if (selected) void processResumeFile(selected);
                        }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">PDF or DOCX · up to 10 MB</p>
                  </GlassCard>

                  <GlassCard>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-accent" /> Job Description
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {jobDescription.length} characters
                      </span>
                    </div>
                    <div className="mb-3 inline-flex rounded-xl border border-border bg-background/40 p-1 text-xs">
                      {(["paste", "upload"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setIntake({ jdMode: mode })}
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
                        onChange={(event) => setIntake({ jobDescription: event.target.value })}
                        placeholder="Paste the Job Description here…"
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
                              <>
                                Loaded <span className="text-foreground">{jdFileName}</span>
                              </>
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
                            id="jd-upload"
                            name="jd-upload"
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
                      </div>
                    )}
                  </GlassCard>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={reset}
                      className="rounded-xl border-border bg-background/40"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={runAnalysis}
                      disabled={!ready}
                      className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 shadow-xl shadow-primary/25"
                    >
                      <Sparkles className="h-4 w-4" /> Analyze Resume
                    </Button>
                  </div>
                </motion.div>
              )}

              {phase === "running" && (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mx-auto flex min-h-full max-w-2xl flex-col justify-center"
                >
                  <GlassCard>
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-xl border border-border bg-primary/10 p-2.5 text-primary">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                          Running Pipeline
                        </div>
                        <h3 className="text-lg font-semibold">Analyzing candidate against role</h3>
                      </div>
                    </div>
                    <ol className="space-y-3">
                      {LOADING_STEPS.map((step, i) => {
                        const done = i < activeStep;
                        const current = i === activeStep;
                        return (
                          <motion.li
                            key={step.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                              done && "border-emerald-400/30 bg-emerald-500/5",
                              current && "border-primary/40 bg-primary/5",
                              !done && !current && "border-border bg-background/40",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold",
                                done && "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
                                current && "border-primary/40 bg-primary/20 text-primary",
                                !done && !current && "border-border text-muted-foreground",
                              )}
                            >
                              {done ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : current ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                i + 1
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                done || current ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {step.label}
                            </span>
                          </motion.li>
                        );
                      })}
                    </ol>
                  </GlassCard>
                </motion.div>
              )}

              {phase === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto flex min-h-full max-w-xl flex-col justify-center"
                >
                  <GlassCard className="text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">Pipeline stopped</h3>
                    {failedStage && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Failed at stage: <span className="text-rose-300">{failedStage}</span>
                      </p>
                    )}
                    {errorMessage && (
                      <p className="mt-3 text-sm text-foreground/90">{errorMessage}</p>
                    )}
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <Button type="button" variant="outline" onClick={reset} className="gap-2">
                        <RotateCcw className="h-4 w-4" /> Start Over
                      </Button>
                      <Button type="button" onClick={retry} className="gap-2">
                        <Sparkles className="h-4 w-4" /> Retry
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
