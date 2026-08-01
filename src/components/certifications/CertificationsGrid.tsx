import { motion } from "framer-motion";
import { Award, BadgeCheck, ExternalLink, Calendar } from "lucide-react";
import googleDA from "@/assets/certificates/google-data-analytics.png";
import naukri from "@/assets/certificates/naukri-maestro.jpg";
import ibmML from "@/assets/certificates/ibm-ml-python.png";
import introAI from "@/assets/certificates/intro-to-ai.png";

interface Certification {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  skills: string[];
  image: string;
  url: string;
  gradient: string;
  color: string;
  glow: string;
  featured?: boolean;
}

const certifications: Certification[] = [
  {
    id: "google-data-analytics",
    title: "Google Data Analytics Professional Certificate",
    issuer: "Google · Coursera",
    date: "2024",
    description:
      "Comprehensive specialization covering data cleaning, analysis, visualization, SQL, R programming, and Tableau — building the analytical foundation behind recruitment intelligence.",
    skills: ["SQL", "R Programming", "Tableau", "Data Visualization", "Spreadsheets"],
    image: googleDA,
    url: "https://www.coursera.org/account/accomplishments/specialization/APBHCN2UHB8K",
    gradient: "from-primary/20 to-accent/20",
    color: "rgba(37, 99, 235, 0.4)",
    glow: "shadow-[0_0_60px_-20px_rgba(37,99,235,0.35)]",
    featured: true,
  },
  {
    id: "naukri-maestro",
    title: "Naukri Maestro Recruiter — Fundamental Level",
    issuer: "Naukri.com",
    date: "2025",
    description:
      "Certified on advanced sourcing workflows, candidate engagement, and end-to-end recruiter operations on India's largest hiring platform.",
    skills: ["Sourcing", "Candidate Engagement", "Pipeline Management", "Naukri RMS"],
    image: naukri,
    url: "https://disprzcdn.disprz.com/skilltronassetspublic/Content/naukricom1/Files/Certificates/hemanthxevytecom//7ff39d92-a8bc-4fe8-8b65-ba2c4c3c1f81certificate_images/certificate-naukri_maestro_recruitment_program_-_fundamental_level-gaddam_hemanth_kumar.jpg",
    gradient: "from-cyan-500/20 to-emerald-500/20",
    color: "rgba(56, 189, 248, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(56,189,248,0.3)]",
  },
  {
    id: "ibm-ml-python",
    title: "Machine Learning with Python",
    issuer: "IBM · Cognitive Class",
    date: "2024",
    description:
      "Hands-on training in supervised and unsupervised learning, regression, classification, and clustering using Python and scikit-learn.",
    skills: ["Python", "scikit-learn", "Regression", "Classification", "Clustering"],
    image: ibmML,
    url: "https://courses.cognitiveclass.ai/certificates/dd38d1f7ec824522a0ef92c7b1e108e5",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    color: "rgba(139, 92, 246, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)]",
  },
  {
    id: "intro-to-ai",
    title: "Introduction to Artificial Intelligence",
    issuer: "Simplilearn · SkillUp",
    date: "2023",
    description:
      "Foundational course on AI concepts, machine learning basics, neural networks, and real-world applications powering modern intelligent systems.",
    skills: ["Artificial Intelligence", "Machine Learning", "Neural Networks", "AI Applications"],
    image: introAI,
    url: "https://certificates.simplicdn.net/share/4680004.pdf",
    gradient: "from-amber-500/20 to-orange-500/20",
    color: "rgba(251, 191, 36, 0.4)",
    glow: "shadow-[0_0_40px_-12px_rgba(251,191,36,0.3)]",
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

function CertificationCard({
  item,
  featured = false,
}: {
  item: Certification;
  featured?: boolean;
}) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]
        transition-all duration-300 ease-out
        hover:-translate-y-2 hover:border-white/[0.14] hover:bg-white/[0.04]
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

      <div
        className={`relative z-10 ${featured ? "grid gap-6 md:grid-cols-2 md:gap-8 p-6 md:p-8" : "flex flex-col p-5"}`}
      >
        {/* Preview image */}
        <div
          className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/30 ${featured ? "aspect-[4/3] md:aspect-auto" : "aspect-[16/10] mb-5"}`}
        >
          <img
            src={item.image}
            alt={`${item.title} certificate preview`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
            <BadgeCheck className="h-3 w-3 text-accent" />
            Verified
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col">
          <h3
            className={`font-semibold tracking-tight text-foreground ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}
          >
            {item.title}
          </h3>

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

          <p
            className={`mt-4 leading-relaxed text-muted-foreground ${featured ? "text-base" : "text-sm"}`}
          >
            {item.description}
          </p>

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

          <div className="mt-6">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-white/20 hover:from-primary/30 hover:to-accent/30"
            >
              View Certificate
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
