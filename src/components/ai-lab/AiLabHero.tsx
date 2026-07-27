import { motion } from "framer-motion";
import { Sparkles, Cpu, ArrowRight, FlaskConical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { HeroBackground } from "@/components/home/HeroBackground";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export function AiLabHero() {
  return (
    <section className="relative -mt-24 overflow-hidden pt-36 pb-16 md:pt-40 md:pb-24">
      <HeroBackground />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 text-center">
        <motion.span
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          AI Experiments for Recruiters
        </motion.span>

        <motion.h1
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.7, delay: 0.05, ease }}
          className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl"
        >
          The <span className="text-gradient">AI Lab</span>
        </motion.h1>

        <motion.p
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          A sandbox of intelligent recruiting agents. Preview the next generation of
          sourcing, screening, and hiring automation.
        </motion.p>

        <motion.div
          initial={fadeUp.initial}
          animate={fadeUp.animate}
          transition={{ duration: 0.7, delay: 0.25, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-transform hover:scale-[1.02]"
          >
            <Cpu className="h-4 w-4" />
            Explore Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-white/[0.08]"
          >
            <FlaskConical className="h-4 w-4 text-accent" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
