import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, FileText, PlayCircle, Clock, ArrowRight, Sparkles, Filter } from "lucide-react";

type ContentCategory = "All" | "Article" | "Playbook" | "Video";

interface ContentItem {
  id: string;
  category: Exclude<ContentCategory, "All">;
  title: string;
  description: string;
  readTime: string;
  icon: React.ElementType;
  gradient: string;
  color: string;
  glow: string;
  featured?: boolean;
}

const categories: ContentCategory[] = ["All", "Article", "Playbook", "Video"];

const contentItems: ContentItem[] = [
  {
    id: "featured",
    category: "Playbook",
    title: "The AI Recruiter's Playbook",
    description: "A complete guide to integrating AI into your recruiting workflow — from sourcing to offer. Learn how to write better JDs, build Boolean strings, and screen candidates with AI without losing the human touch.",
    readTime: "18 min read",
    icon: Sparkles,
    gradient: "from-primary/20 to-accent/20",
    color: "rgba(37, 99, 235, 0.4)",
    glow: "shadow-[0_0_60px_-20px_rgba(37,99,235,0.35)]",
    featured: true,
  },
  {
    id: "boolean-strings",
    category: "Article",
    title: "Boolean Search for Technical Roles",
    description: "How to build precise boolean strings for GitHub, LinkedIn, and niche sourcing channels.",
    readTime: "6 min read",
    icon: FileText,
    gradient: "from-cyan-500/20 to-emerald-500/20",
    color: "rgba(56, 189, 248, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.3)]",
  },
  {
    id: "resume-ai",
    category: "Article",
    title: "Resume Screening with AI",
    description: "Use AI to extract skills, detect gaps, and score candidates objectively.",
    readTime: "5 min read",
    icon: FileText,
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    color: "rgba(139, 92, 246, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)]",
  },
  {
    id: "interview-playbook",
    category: "Playbook",
    title: "Technical Interview Playbook",
    description: "Role-specific question banks and evaluation rubrics for frontend, backend, and AI engineers.",
    readTime: "12 min read",
    icon: BookOpen,
    gradient: "from-amber-500/20 to-orange-500/20",
    color: "rgba(251, 191, 36, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(251,191,36,0.3)]",
  },
  {
    id: "salary-negotiation",
    category: "Video",
    title: "Salary Negotiation for Recruiters",
    description: "A 10-minute walkthrough on market benchmarking, offer positioning, and closing candidates.",
    readTime: "10 min watch",
    icon: PlayCircle,
    gradient: "from-rose-500/20 to-pink-500/20",
    color: "rgba(244, 63, 94, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(244,63,94,0.3)]",
  },
  {
    id: "sourcing-tips",
    category: "Video",
    title: "Sourcing Passive Engineers",
    description: "Strategies and outreach templates to engage high-demand technical talent.",
    readTime: "8 min watch",
    icon: PlayCircle,
    gradient: "from-emerald-500/20 to-teal-500/20",
    color: "rgba(16, 185, 129, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.3)]",
  },
  {
    id: "jd-generator",
    category: "Article",
    title: "Writing JDs That Convert",
    description: "Why most job descriptions fail, and how to write ones that attract senior engineers.",
    readTime: "7 min read",
    icon: FileText,
    gradient: "from-blue-500/20 to-indigo-500/20",
    color: "rgba(99, 102, 241, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(99,102,241,0.3)]",
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

export function ContentLibrary() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("All");

  const featured = contentItems.find((item) => item.featured);
  const filtered = contentItems.filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );
  const nonFeatured = filtered.filter((item) => !item.featured);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      {/* Filter bar */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <div className="mr-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </div>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`
              rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-300
              ${
                activeCategory === category
                  ? "border-primary/50 bg-primary/10 text-foreground shadow-[0_0_20px_-8px_rgba(37,99,235,0.4)]"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Featured content */}
      <AnimatePresence mode="wait">
        {featured && (activeCategory === "All" || activeCategory === featured.category) && (
          <motion.div
            key={`featured-${activeCategory}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <ContentCard item={featured} featured />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        key={activeCategory}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {nonFeatured.map((item) => (
            <motion.div key={item.id} variants={itemVariants} layout>
              <ContentCard item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {nonFeatured.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center text-muted-foreground"
        >
          No content found in this category.
        </motion.div>
      )}
    </div>
  );
}

function ContentCard({ item, featured = false }: { item: ContentItem; featured?: boolean }) {
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
          <div
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          >
            <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.category}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold tracking-tight text-foreground ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          {item.title}
        </h3>

        {/* Description */}
        <p className={`mt-3 leading-relaxed text-muted-foreground ${featured ? "text-base md:text-lg" : "text-sm"}`}>
          {item.description}
        </p>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {item.readTime}
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-300 hover:bg-white/[0.06] hover:text-foreground disabled:cursor-not-allowed"
          >
            {item.category === "Video" ? "Watch" : "Read"}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
