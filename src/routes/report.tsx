import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { RecruiterReport } from "@/components/report/RecruiterReport";
import { Button } from "@/components/ui/button";
import { runResumeIntelligence, type PipelineResult } from "@/lib/pipeline.functions";
import { extractResumeText } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";

type Phase = "intake" | "running" | "done" | "error";

const LOADING_STEPS = [
  { key: "upload", label: "Resume Uploaded" },
  { key: "resumeParser", label: "Parsing Resume" },
  { key: "jdIntelligence", label: "Understanding Job Description" },
  { key: "skillNormalization", label: "Normalizing Skills" },
  { key: "matching", label: "Matching Skills" },
  { key: "evidence", label: "Analyzing Evidence" },
  { key: "report", label: "Preparing Report" },
] as const;

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Recruiter Intelligence Report — TalentOS" },
      { name: "description", content: "A premium recruiter-grade intelligence report powered by the TalentOS Resume Intelligence Pipeline." },
      { property: "og:title", content: "Recruiter Intelligence Report — TalentOS" },
      { property: "og:description", content: "Explainable candidate intelligence: skills, evidence, pipeline transparency." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const runPipeline = useServerFn(runResumeIntelligence);
  const [phase, setPhase] = useState<Phase>("intake");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedStage, setFailedStage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const handleFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      toast.error("Upload a PDF or DOCX resume.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume must be under 10 MB.");
      return;
    }
    setExtracting(true);
    setResumeFile(file);
    try {
      const text = await extractResumeText(file);
      setResumeText(text);
      toast.success("Resume ready");
    } catch (err) {
      console.error("[TalentOS Report] resume extract failed:", err);
      toast.error("Could not read that resume file.");
      setResumeFile(null);
      setResumeText("");
    } finally {
      setExtracting(false);
    }
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const runReport = useCallback(async () => {
    if (!resumeText || resumeText.trim().length < 20) {
      toast.error("Upload a resume first.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      toast.error("Paste a Job Description with at least 20 characters.");
      return;
    }
    setPhase("running");
    setResult(null);
    setErrorMessage("");
    setFailedStage(null);
    setActiveStep(1); // "Parsing Resume" begins right after "Resume Uploaded"

    // Illuminate steps progressively while the pipeline runs. This is purely
    // visual — the real outcome (and per-stage timings) come from metadata.
    clearTimer();
    stepTimerRef.current = setInterval(() => {
      setActiveStep((s) => (s < LOADING_STEPS.length - 2 ? s + 1 : s));
    }, 900);

    try {
      const output = await runPipeline({
        data: { resumeText, jobDescription },
      });
      clearTimer();
      setResult(output);
      if (output.ok) {
        setActiveStep(LOADING_STEPS.length - 1);
        // brief hold so the last step visibly illuminates
        setTimeout(() => setPhase("done"), 350);
      } else {
        setFailedStage(String(output.failedStage));
        setErrorMessage(output.error.message);
        setPhase("error");
      }
    } catch (err) {
      clearTimer();
      const message = err instanceof Error ? err.message : "Pipeline call failed.";
      console.error("[TalentOS Report] pipeline failed:", err);
      setErrorMessage(message);
      setPhase("error");
    }
  }, [jobDescription, resumeText, runPipeline]);

  const resetAll = useCallback(() => {
    clearTimer();
    setPhase("intake");
    setResumeFile(null);
    setResumeText("");
    setJobDescription("");
    setResult(null);
    setActiveStep(0);
    setErrorMessage("");
    setFailedStage(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const retry = useCallback(() => {
    setPhase("intake");
    setErrorMessage("");
    setFailedStage(null);
    setResult(null);
  }, []);

  return (
    <PageShell
      eyebrow="Intelligence Report"
      title={<>Recruiter <span className="text-gradient">Intelligence</span></>}
      description="Explainable candidate intelligence from the TalentOS pipeline — skills, evidence, and transparency."
    >
      <AnimatePresence mode="wait">
        {phase === "intake" && (
          <motion.div key="intake" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <IntakeForm
              resumeFile={resumeFile}
              extracting={extracting}
              dragActive={dragActive}
              inputRef={inputRef}
              onFile={handleFile}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              onSubmit={runReport}
            />
          </motion.div>
        )}

        {phase === "running" && (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSteps activeStep={activeStep} />
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ErrorPanel stage={failedStage} message={errorMessage} onRetry={retry} onReset={resetAll} />
          </motion.div>
        )}

        {phase === "done" && result?.ok && (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" /> New Report
              </Button>
            </div>
            <RecruiterReport data={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

/* -------------------- Intake -------------------- */

interface IntakeFormProps {
  resumeFile: File | null;
  extracting: boolean;
  dragActive: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  jobDescription: string;
  setJobDescription: (v: string) => void;
  onSubmit: () => void;
}

function IntakeForm(props: IntakeFormProps) {
  const { resumeFile, extracting, dragActive, inputRef, onFile, onDragOver, onDragLeave, onDrop, jobDescription, setJobDescription, onSubmit } = props;
  const ready = !!resumeFile && !extracting && jobDescription.trim().length >= 20;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/40 p-8 text-center backdrop-blur-xl transition-colors",
          dragActive && "border-primary/60 bg-primary/5",
        )}
      >
        <div className="mb-3 rounded-2xl border border-white/10 bg-primary/10 p-3 text-primary">
          <FileUp className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">Drop resume here or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          browse files (PDF or DOCX)
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        {extracting && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading resume…
          </div>
        )}
        {resumeFile && !extracting && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {resumeFile.name}
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
        <label className="mb-2 text-sm font-medium">Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full Job Description here…"
          rows={10}
          className="min-h-[220px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-background/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{jobDescription.trim().length} characters</span>
          <Button onClick={onSubmit} disabled={!ready} className="gap-2">
            <Sparkles className="h-4 w-4" /> Analyze Resume
          </Button>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Upload className="mt-0.5 h-3.5 w-3.5" />
          <span>
            The TalentOS Resume Intelligence Pipeline (Resume Parser → JD Intelligence → Skill Normalization → Matching → Evidence) runs once against your inputs and populates every section of the report from the returned output.
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Loading -------------------- */

function LoadingSteps({ activeStep }: { activeStep: number }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-primary/10 p-2.5 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Running Pipeline</div>
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
                !done && !current && "border-white/5 bg-white/[0.02]",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done && "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
                  current && "border-primary/40 bg-primary/20 text-primary",
                  !done && !current && "border-white/10 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : current ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
              </span>
              <span className={cn("text-sm", done ? "text-foreground" : current ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------- Error -------------------- */

function ErrorPanel({ stage, message, onRetry, onReset }: { stage: string | null; message: string; onRetry: () => void; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-rose-400/30 bg-rose-500/5 p-8 text-center backdrop-blur-xl">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">Pipeline stopped</h3>
      {stage && (
        <p className="mt-1 text-sm text-muted-foreground">
          Failed at stage: <span className="text-rose-300">{stage}</span>
        </p>
      )}
      {message && <p className="mt-3 text-sm text-foreground/90">{message}</p>}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Start Over
        </Button>
        <Button onClick={onRetry} className="gap-2">
          <Sparkles className="h-4 w-4" /> Retry
        </Button>
      </div>
    </div>
  );
}