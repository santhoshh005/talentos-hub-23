import { motion } from "framer-motion";
import {
  Award,
  Shield,
  Bot,
  Search,
  Users,
  LineChart,
  BadgeCheck,
  ExternalLink,
  Calendar,
} from "lucide-react";

interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  skills: string[];
  icon: React.ElementType;
  gradient: string;
  color: string;
  glow: string;
  featured?: boolean;
}

const certifications: Certification[] = [
  {
    id: "airecruiter",
    title: "AI for Recruiters",
    issuer: "LinkedIn Learning",
    date: "2025",
    description: "Mastered practical AI applications for sourcing, screening, and candidate engagement. Covered prompt engineering, LLM use cases, and ethical AI in hiring.",
    skills: ["Prompt Engineering", "LLM Tools", "AI Sourcing", "Ethical AI"],
    icon: Bot,
    gradient: "from-primary/20 to-accent/20",
    color: "rgba(37, 99, 235, 0.4)",
    glow: "shadow-[0_0_60px_-20px_rgba(37,99,235,0.35)]",
    featured: true,
  },
  {
    id: "boolean",
    title: "Advanced Boolean Search",
    issuer: "SourceCon",
    date: "2025",
    description: "Certified in advanced boolean search, x-ray search, and building complex talent pipelines across GitHub, LinkedIn, and niche platforms.",
    skills: ["Boolean Logic", "X-Ray Search", "Talent Pipelines", "Niche Sourcing"],
    icon: Search,
    gradient: "from-cyan-500/20 to-emerald-500/20",
    color: "rgba(56, 189, 248, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.3)]",
  },
  {
    id: "technical-recruitment",
    title: "Technical Recruitment Fundamentals",
    issuer: "Recruiter.com",
    date: "2025",
    description: "Comprehensive training on evaluating software engineers, understanding tech stacks, and partnering with engineering hiring managers.",
    skills: ["Tech Stack Evaluation", "Interview Coordination", "Hiring Manager Partnership"],
    icon: Users,
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    color: "rgba(139, 92, 246, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)]",
  },
  {
    id: "dei",
    title: "Diversity & Inclusion in Hiring",
    issuer: "SHRM",
    date: "2025",
    description: "Learned frameworks to reduce bias in job descriptions, interviews, and offer processes to build inclusive engineering teams.",
    skills: ["Unconscious Bias", "Inclusive JDs", "Structured Interviews", "Equity"],
    icon: Shield,
    gradient: "from-amber-500/20 to-orange-500/20",
    color: "rgba(251, 191, 36, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(251,191,36,0.3)]",
  },
  {
    id: "analytics",
    title: "Recruitment Analytics & Metrics",
    issuer: "Greenhouse",
    date: "2024",
    description: "Built dashboards and reporting workflows to track time-to-fill, quality-of-hire, pipeline conversion, and source effectiveness.",
    skills: ["ATS Reporting", "Time-to-Fill", "Quality-of-Hire", "Pipeline Conversion"],
    icon: LineChart,
    gradient: "from-emerald-500/20 to-teal-500/20",
    color: "rgba(16, 185, 129, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.3)]",
  },
  {
    id: "data",
    title: "Data Analytics for Business",
    issuer: "Google",
    date: "2024",
    description: "Developed data literacy, SQL, spreadsheet modeling, and visualization skills that inform recruiting strategy and talent planning.",
    skills: ["SQL", "Spreadsheet Modeling", "Data Visualization", "Business Intelligence"],
    icon: Award,
    gradient: "from-rose-500/20 to-pink-500/20",
    color: "rgba(244, 63, 94, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(244,63,94,0.3)]",
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
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function CertificationsGrid() {
  const featured = certifications.find((c) => c.featured);
  const others = certifications.filter((c) => !c.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      {/* Featured certification */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <CertificationCard item={featured} featured />
        </motion.div>
      )}

      {/* Certifications grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {others.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <CertificationCard item={item} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function CertificationCard({ item, featured = false }: { item: Certification; featured?: boolean }) {
  const Icon = item.icon;

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]
        transition-all duration-300 ease-out
        hover:-translate-y-2 hover:border-white/[0.14] hover:bg-white/[0.04]
        ${featured ? "p-8 md:p-10" : "p-6"}
        ${item.glow}
      `}
    >
      {/* Animated gradient background */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br ${item.gradient}
          opacity-0 transition-opacity duration-500 group-hover:opacity-100
        `}
      />

      {/* Radial glow on hover */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)` }}
      />

      <div className={`relative z-10 flex flex-col ${featured ? "md:max-w-2xl" : ""}`}>
        {/* Top row */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <BadgeCheck className="h-3 w-3 text-accent" />
            Verified
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-semibold tracking-tight text-foreground ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          {item.title}
        </h3>

        {/* Issuer & date */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            {item.issuer}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {item.date}
          </span>
        </div>

        {/* Description */}
        <p className={`mt-4 leading-relaxed text-muted-foreground ${featured ? "text-base md:text-lg" : "text-sm"}`}>
          {item.description}
        </p>

        {/* Skills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {item.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted-transition transition-colors duration-300 hover:bg-white/[0.06] hover:text-foreground disabled:cursor-not-allowed"
          >
            View Credential
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
