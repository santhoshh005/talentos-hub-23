import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Bot, LineChart, Users } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentOS — AI-Powered Recruitment by Hemanth Kumar" },
      { name: "description", content: "TalentOS is an AI-powered recruitment platform combining intelligent sourcing, automation, and modern recruiter workflows." },
      { property: "og:title", content: "TalentOS — AI-Powered Recruitment" },
      { property: "og:description", content: "The operating system for modern technical recruiters." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Introducing TalentOS · v1.0
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            The operating system for{" "}
            <span className="text-gradient">modern recruiters</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            AI-powered sourcing, automated workflows, and premium tooling — built by
            Hemanth Kumar to redefine technical recruitment.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-transform hover:scale-[1.02]"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/ai-lab"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-white/[0.06]"
            >
              Explore AI Lab
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 grid gap-4 md:grid-cols-3"
        >
          {[
            { icon: Bot, title: "AI Sourcing", desc: "Discover high-signal candidates with intelligent search agents." },
            { icon: LineChart, title: "Pipeline Insights", desc: "Real-time analytics on funnels, sourcing, and conversion." },
            { icon: Users, title: "Recruiter Workflows", desc: "Modern collaboration surfaces built for hiring teams." },
          ].map((f) => (
            <div key={f.title} className="glass-panel rounded-2xl p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-white/10">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>
    </AppLayout>
  );
}
