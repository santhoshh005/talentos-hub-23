import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

const TAGLINE = "Building the Future of AI Recruitment";

export function LoaderLogo() {
  const reduce = useReducedMotion();

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <motion.div
          className="absolute -inset-8 rounded-full bg-primary/30 blur-3xl"
          animate={reduce ? undefined : { opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_0_40px_-4px] shadow-primary/70">
            <Sparkles className="h-6 w-6 text-white" />
          </span>
          <span className="text-4xl font-semibold tracking-tight md:text-5xl">
            Talent<span className="text-gradient">OS</span>
          </span>
        </div>
      </motion.div>

      <div className="mt-5 h-6 text-sm md:text-base text-muted-foreground" aria-label={TAGLINE}>
        {reduce ? (
          <span>{TAGLINE}</span>
        ) : (
          <span className="inline-block">
            {TAGLINE.split("").map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.025, duration: 0.15 }}
              >
                {c}
              </motion.span>
            ))}
            <motion.span
              className="ml-0.5 inline-block h-4 w-[2px] bg-accent align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </span>
        )}
      </div>
    </div>
  );
}