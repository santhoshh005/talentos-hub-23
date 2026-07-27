import { motion } from "framer-motion";
import { ArrowUpRight, Clock, FileText, Sparkles, Users, TrendingUp, Linkedin } from "lucide-react";
import loseAttentionCover from "@/assets/recruitment-insights/lose-attention.png.asset.json";
import whichResumeFirstCover from "@/assets/recruitment-insights/which-resume-first.png.asset.json";
import aiResumesCover from "@/assets/recruitment-insights/19-ai-resumes.png.asset.json";
import whyAtsRejectsCover from "@/assets/recruitment-insights/why-ats-rejects.png.asset.json";
import hiringMythsCover from "@/assets/recruitment-insights/hiring-myths.png.asset.json";

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
    id: "lose-attention",
    category: "Inside Recruitment",
    title: "The Fastest Way to Lose a Recruiter's Attention",
    excerpt:
      "Every resume looked exactly the same — Java, Spring Boot, AWS, SQL. We don't lose attention because of length. We lose it when nothing feels unique.",
    readTime: "5 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_inside-requirement-03-the-fastest-way-activity-7485931746786643968-T6-S?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: loseAttentionCover.url,
    coverAlt: "Inside Recruitment #03 — The fastest way to lose a recruiter's attention",
    icon: Users,
    glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)]",
  },
  {
    id: "which-resume-first",
    category: "Resume Tips",
    title: "How Do Recruiters Decide Whose Resume to Open First?",
    excerpt:
      "The hidden signals recruiters scan in seconds — and why the order your resume gets opened often decides whether it gets read at all.",
    readTime: "4 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_insiderecruitment-resumetips-recruitment-activity-7485571441611153408-cVr5?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: whichResumeFirstCover.url,
    coverAlt: "Inside Recruitment #02 — Why does a recruiter open one resume before another?",
    icon: FileText,
    glow: "shadow-[0_0_40px_-12px_rgba(37,99,235,0.35)]",
  },
  {
    id: "19-ai-resumes",
    category: "AI in Recruitment",
    title: "I Screened 19 AI/ML Resumes — Only 3 Made the Shortlist",
    excerpt:
      "What separated the 3 shortlisted AI/ML engineers from the other 16 — the patterns, projects, and phrasing that actually stood out.",
    readTime: "6 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_insiderecruitment-recruitment-aijobs-activity-7485230253007708160-RQRO?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: aiResumesCover.url,
    coverAlt: "Inside Recruitment #01 — Out of 19 AI/ML resumes I screened, only 3 were shortlisted",
    icon: Sparkles,
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]",
  },
  {
    id: "why-ats-rejects",
    category: "Resume Tips",
    title: "Why ATS Rejects You",
    excerpt:
      "The real reasons Applicant Tracking Systems filter you out — formatting traps, keyword mismatches, and the fixes that get you past the bot.",
    readTime: "5 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_ats-resumetips-recruitment-activity-7484844001473269760-LQrD?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: whyAtsRejectsCover.url,
    coverAlt: "Why ATS rejects you — your resume is good, your formatting isn't",
    icon: FileText,
    glow: "shadow-[0_0_40px_-12px_rgba(37,99,235,0.35)]",
  },
  {
    id: "hiring-myths",
    category: "Hiring Trends",
    title: "3 Hiring Myths I Stopped Believing",
    excerpt:
      "The recruiter beliefs that sound obvious but quietly break hiring — and what actually works once you let them go.",
    readTime: "4 min read",
    href: "https://www.linkedin.com/posts/hemanth-kumar-235078270_talentacquisition-hiringmyths-recruiterlife-activity-7482410583711977472-_C4c?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEI3rkkBiQddNH4UAJkE1OjPdLEpFFWDnmM",
    coverUrl: hiringMythsCover.url,
    coverAlt: "Talent Acquisition — 3 hiring myths I stopped believing",
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

export function ContentLibrary() {
  return (
    <section className="relative pb-8">
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
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {posts.map((post) => (
          <motion.div key={post.id} variants={itemVariants}>
            <InsightCard post={post} />
          </motion.div>
        ))}
      </motion.div>
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
