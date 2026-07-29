import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { HeroBackground } from "@/components/home/HeroBackground";

const ease = [0.22, 1, 0.36, 1] as const;

export function WorkspaceHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <section className="relative -mt-24 overflow-hidden pt-32 pb-10 md:pt-36 md:pb-14">
      <HeroBackground />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start px-4">
        <motion.span
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {eyebrow}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease }}
          className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}
