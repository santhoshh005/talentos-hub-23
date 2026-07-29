import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderBackground } from "./LoaderBackground";
import { LoaderLogo } from "./LoaderLogo";
import { LoadingMessageRotator } from "./LoadingMessageRotator";
import { RecruitmentWorkflow } from "./RecruitmentWorkflow";
import { LoaderProgress } from "./LoaderProgress";
import { QuoteFlash } from "./QuoteFlash";

interface Props {
  variant?: "cinematic" | "inline";
  progress?: number;
  autoDurationMs?: number;
  onDone?: () => void;
  show?: boolean;
}

export function TalentOSLoader({
  variant = "cinematic",
  progress,
  autoDurationMs = 3400,
  onDone,
  show = true,
}: Props) {
  const [auto, setAuto] = useState(0);
  const controlled = typeof progress === "number";

  useEffect(() => {
    if (controlled) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / autoDurationMs);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setAuto(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controlled, autoDurationMs, onDone]);

  const value = controlled ? Math.max(0, Math.min(100, progress!)) : auto;

  if (variant === "inline") {
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
        <LoaderLogo />
        <LoadingMessageRotator />
        <LoaderProgress progress={value} />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="talentos-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] text-foreground"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <LoaderBackground />
          <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-6">
            <LoaderLogo />
            <LoadingMessageRotator />
            <RecruitmentWorkflow progress={value} />
            <LoaderProgress progress={value} />
            <QuoteFlash />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
