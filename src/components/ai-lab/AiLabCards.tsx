import { motion } from "framer-motion";
import {
  FileSearch,
  FileText,
  SearchCode,
  BarChart3,
  MessageSquareQuoteIcon,
  Coins,
  Sparkles,
} from "lucide-react";

interface AiLabCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  glow: string;
}

const cards: AiLabCard[] = [
  {
    id: "resume-analyzer",
    title: "Resume Analyzer",
    subtitle: "Upload Resume",
    description: "Extract skills, experience, and fit signals from any resume in seconds.",
    icon: FileSearch,
    gradient: "from-blue-500/20 to-cyan-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(37,99,235,0.5)]",
  },
  {
    id: "jd-generator",
    title: "JD Generator",
    subtitle: "Generate Job Descriptions",
    description: "Create precise, inclusive job descriptions tuned for top engineering talent.",
    icon: FileText,
    gradient: "from-cyan-500/20 to-emerald-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(56,189,248,0.5)]",
  },
  {
    id: "boolean-search",
    title: "Boolean Search Generator",
    subtitle: "Candidate Match",
    description: "Build powerful boolean strings for LinkedIn, GitHub, and niche sourcing.",
    icon: SearchCode,
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(139,92,246,0.5)]",
  },
  {
    id: "candidate-match",
    title: "Candidate Match Score",
    subtitle: "AI Ranking",
    description: "Score applicants against role requirements with explainable AI signals.",
    icon: BarChart3,
    gradient: "from-amber-500/20 to-orange-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]",
  },
  {
    id: "interview-generator",
    title: "Interview Question Generator",
    subtitle: "Smart Interviews",
    description: "Generate role-specific technical and behavioral interview questions.",
    icon: MessageSquareQuoteIcon,
    gradient: "from-rose-500/20 to-pink-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(244,63,94,0.5)]",
  },
  {
    id: "salary-estimator",
    title: "Salary Estimator",
    subtitle: "Compensation Intelligence",
    description: "Estimate competitive salaries by role, location, and market data.",
    icon: Coins,
    gradient: "from-emerald-500/20 to-teal-500/20",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.5)]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function AiLabCards() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          variants={itemVariants}
          className="group relative"
        >
          <div
            className={`
              relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]
              p-6 transition-all duration-300 ease-out
              hover:-translate-y-2 hover:border-white/[0.14] hover:bg-white/[0.04]
              ${card.glow}
            `}
          >
            {/* Animated gradient background */}
            <div
              className={`
                absolute inset-0 bg-gradient-to-br ${card.gradient}
                opacity-0 transition-opacity duration-500 group-hover:opacity-100
              `}
            />

            {/* Radial glow on hover */}
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
              style={{
                background: `radial-gradient(circle, ${card.glow.includes("blue") ? "rgba(37,99,235,0.4)" : card.glow.includes("cyan") ? "rgba(56,189,248,0.4)" : card.glow.includes("violet") ? "rgba(139,92,246,0.4)" : card.glow.includes("amber") ? "rgba(251,191,36,0.4)" : card.glow.includes("rose") ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.4)"} 0%, transparent 70%)`,
              }}
            />

            <div className="relative z-10 flex flex-col">
              {/* Icon */}
              <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <card.icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              {/* Badge */}
              <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                {card.subtitle}
              </span>

              {/* Title */}
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {card.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>

              {/* Button */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:bg-white/[0.06] hover:text-foreground disabled:cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
