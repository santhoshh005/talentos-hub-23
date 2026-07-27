import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { dashboardSearchSchema } from "@/lib/dashboard-search";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, PlayCircle, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBackground } from "@/components/home/HeroBackground";
import { FloatingCards } from "@/components/home/FloatingCards";
import { DashboardSection } from "@/components/home/DashboardSection";
import { RecruitmentInsights } from "@/components/home/RecruitmentInsights";

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(dashboardSearchSchema),
  head: () => ({
    meta: [
      { title: "TalentOS | AI Recruitment Platform" },
      {
        name: "description",
        content:
          "TalentOS is an AI-powered recruitment platform that helps recruiters generate job descriptions, analyze resumes, create Boolean searches, estimate salaries, and streamline hiring with AI.",
      },
      { property: "og:title", content: "TalentOS | AI Recruitment Platform" },
      {
        property: "og:description",
        content:
          "Building the future of AI recruitment — intelligent sourcing, automation, and recruiter-first workflows by Hemanth Kumar.",
      },
    ],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  const fadeUp = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <section className="relative -mt-24 flex min-h-screen items-center overflow-hidden pt-24">
        <HeroBackground />

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-28 pt-8 md:pt-12 lg:grid-cols-2 lg:items-center lg:gap-10">
          {/* Left */}
          <div className="relative z-10 max-w-xl">
            <motion.span
              {...fadeUp}
              transition={{ duration: 0.5, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              AI Powered Recruitment Platform
            </motion.span>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.05, ease }}
              className="mt-6 text-6xl font-semibold tracking-tight md:text-7xl lg:text-8xl"
            >
              <span className="text-gradient">TalentOS</span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.15, ease }}
              className="mt-4 text-2xl font-medium tracking-tight text-foreground/90 md:text-3xl"
            >
              Building the Future of{" "}
              <span className="text-gradient">AI Recruitment</span>
            </motion.p>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.25, ease }}
              className="mt-5 max-w-lg text-pretty text-base text-muted-foreground md:text-lg"
            >
              Helping companies hire top technology talent through AI-powered
              recruitment, automation and recruiter-first workflows.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-transform hover:scale-[1.02]"
              >
                Explore Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/ai-lab"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-white/[0.08]"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                Try AI Lab
              </Link>
              <button
                type="button"
                disabled
                aria-label="Watch demo — coming soon"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-white/10 bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <PlayCircle className="h-4 w-4" />
                Watch Demo
                <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                  Soon
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="relative z-10"
          >
            <FloatingCards />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.a
          href="#next"
          aria-label="Scroll down"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-muted-foreground"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
            <div className="relative flex h-9 w-5 justify-center rounded-full border border-white/15 bg-white/[0.03] backdrop-blur">
              <motion.span
                animate={{ y: [2, 14, 2], opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-accent"
              />
            </div>
            <motion.div
              animate={{ y: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </div>
        </motion.a>
      </section>

      <div id="next" />
      <DashboardSection />
      <RecruitmentInsights />
    </AppLayout>
  );
}