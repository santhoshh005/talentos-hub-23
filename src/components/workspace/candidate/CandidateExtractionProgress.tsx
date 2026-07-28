import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

const STEPS = [
  "Reading resume",
  "Extracting identity & contact",
  "Parsing employment history",
  "Detecting skills",
  "Building candidate record",
];

export function CandidateExtractionProgress({ activeStep }: { activeStep: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-primary/10 p-2.5 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Extracting</div>
          <h3 className="text-lg font-semibold">Building candidate record with AI…</h3>
        </div>
      </div>
      <ol className="mt-6 space-y-2.5">
        {STEPS.map((label, i) => {
          const state = i < activeStep ? "done" : i === activeStep ? "active" : "pending";
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${
                  state === "done"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : state === "active"
                    ? "bg-primary/30 text-white"
                    : "bg-white/[0.04] text-muted-foreground"
                }`}
              >
                {state === "done" ? "✓" : state === "active" ? <Sparkles className="h-3 w-3" /> : i + 1}
              </span>
              <span className={state === "pending" ? "text-muted-foreground" : "text-foreground"}>{label}</span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}