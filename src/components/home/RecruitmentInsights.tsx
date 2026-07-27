import { motion } from "framer-motion";
import { ArrowUpRight, Clock, FileText, Sparkles, Users, TrendingUp, Linkedin } from "lucide-react";
import resumeTipsCover from "@/assets/recruitment-insights/resume-tips.jpg.asset.json";
import aiInRecruitmentCover from "@/assets/recruitment-insights/ai-in-recruitment.jpg.asset.json";
import insideRecruitmentCover from "@/assets/recruitment-insights/inside-recruitment.jpg.asset.json";
import hiringTrendsCover from "@/assets/recruitment-insights/hiring-trends.jpg.asset.json";

interface InsightPost {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  href: string;
  coverUrl: string;
  coverAlt: string;
  icon: React.ElementType;
  glow: string;
}

const LINKEDIN_PROFILE = "https://www.linkedin.com/in/hemanth-kumar-235078270";

const posts: InsightPost[] = [
  {
    id: "resume-tips",
    category: "Resume Tips",
    title: "The Resume Patterns That Actually Get Shortlisted",
    excerpt:
      "What top recruiters look for in the first 8 seconds — structure, keywords, and the signal-to-noise ratio that matters most.",
    readTime: "4 min read",
    href: LINKEDIN_PROFILE,
    coverUrl: resumeTipsCover.url,
    coverAlt: "Futuristic resume document with glowing blue accents on a dark background",
    icon: FileText,
    glow: "shadow-[0_0_40px_-12px_rgba(37,99,235,0.35)]",
  },
  {
    id: "ai-in-recruitment",
    category: "AI in Recruitment",
    title: "How AI Is Rewriting the Recruiter Playbook",
    excerpt:
      "From sourcing to screening — the practical AI workflows that are 10x-ing recruiter productivity without losing the human touch.",
    readTime: "6 min read",
    href: LINKEDIN_PROFILE,
    coverUrl: aiInRecruitmentCover.url,
    coverAlt: "AI neural network and recruitment UI panels glowing on a dark background",
    icon: Sparkles,
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]",
  },
  {
    id: "inside-recruitment",
    category: "Inside Recruitment",
    title: "The Fastest Way to Lose a Recruiter's Attention",
    excerpt:
      "Inside Recruitment — We don't lose attention because a resume is one or two pages. We lose attention when we can't find anything unique. Tell me what changed because of your work.",
    readTime: "5 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_insiderecruitment-resumetips-recruitment-activity-7485571441611153408-cVr5?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: insideRecruitmentCover.url,
    coverAlt: "Magnifying glass scanning glowing resume cards on a dark violet background",
    icon: Users,
    glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]",
  },
  {
    id: "hiring-trends",
    category: "Hiring Trends",
    title: "2026 Hiring Trends Every Tech Recruiter Should Watch",
    excerpt:
      "AI-native teams, skill-first hiring, and the shift toward outcome-based roles — what's shaping the next wave of tech hiring.",
    readTime: "7 min read",
    href: LINKEDIN_PROFILE,
    coverUrl: hiringTrendsCover.url,
    coverAlt: "Glowing amber trend charts and analytics on a dark background",
    icon: TrendingUp,
    glow: "shadow-[0_0_40px_-12px_rgba(251,191,36,0.35)]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function RecruitmentInsights() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            <Linkedin className="h-3.5 w-3.5 text-accent" />
            Recruitment Insights
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Fresh thinking from the{" "}
            <span className="text-gradient">recruiting frontlines</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Highlights from my LinkedIn — click any card to read the full post.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <InsightCard post={post} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function InsightCard({ post }: { post: InsightPost }) {
  const Icon = post.icon;
  return (
    <a
      href={post.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-all duration-300 ease-out hover:-translate-y-2 hover:border-white/[0.14] hover:bg-white/[0.04] ${post.glow}`}
    >
      {/* Cover image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/[0.06]">
        <img
          src={post.coverUrl}
          alt={post.coverAlt}
          width={1024}
          height={640}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="h-6 w-6 text-white/90" strokeWidth={1.5} />
          </div>
        </div>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
          {post.category}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-white">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-5 flex items-center justify-between pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-transform duration-300 group-hover:translate-x-0.5">
            Read on LinkedIn
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </a>
  );
}
