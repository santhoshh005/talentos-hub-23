import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LoaderProgress({ progress }: { progress: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;
    const to = progress;
    const dur = 400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex items-center justify-between text-xs text-white/60">
        <span>Loading TalentOS...</span>
        <span className="tabular-nums font-medium text-white/80">{display}%</span>
      </div>
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_20px_2px] shadow-primary/60"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}