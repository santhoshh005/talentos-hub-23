import { motion, useReducedMotion } from "framer-motion";
import { FileText, Brain, ListChecks, MessageSquare, Handshake, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Resume", Icon: FileText },
  { label: "AI Analysis", Icon: Brain },
  { label: "Shortlisting", Icon: ListChecks },
  { label: "Interview", Icon: MessageSquare },
  { label: "Offer", Icon: Handshake },
  { label: "Hired", Icon: CheckCircle2 },
] as const;

export function RecruitmentWorkflow({ progress }: { progress: number }) {
  const reduce = useReducedMotion();
  const stepFloat = (progress / 100) * STEPS.length;
  const activeIndex = Math.min(STEPS.length - 1, Math.floor(stepFloat));

  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 md:gap-3">
      {STEPS.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.label} className="flex items-center gap-2 md:gap-3">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm backdrop-blur-md transition-colors",
                done && "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
                active && "border-primary/60 bg-primary/15 text-white shadow-[0_0_24px_-4px] shadow-primary/70",
                !done && !active && "border-white/10 bg-white/[0.03] text-white/50",
              )}
            >
              <motion.span
                animate={active && !reduce ? { scale: [1, 1.15, 1] } : undefined}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="grid place-items-center"
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.Icon className="h-3.5 w-3.5" />}
              </motion.span>
              <span className="whitespace-nowrap">{s.label}</span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <ChevronDown className="hidden md:block h-3 w-3 -rotate-90 text-white/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}