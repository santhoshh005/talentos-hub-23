import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { Briefcase, TrendingUp, Code2, Sparkles, ChevronDown, ExternalLink } from "lucide-react";
import rubixeLogo from "@/assets/companies/rubixe.png";
import xevyteLogo from "@/assets/companies/xevyte.png";
import hardwinLogo from "@/assets/companies/hardwin.svg";
import talentosLogo from "@/assets/companies/talentos-ai.png";

interface TimelineItem {
  id: string;
  period: string;
  company: string;
  role: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  logo?: string;
  href?: string;
}

const timelineItems: TimelineItem[] = [
  {
    id: "rubixe",
    period: "Jul 2024 – Jan 2025",
    company: "Rubixe",
    role: "Data Analyst Intern",
    description:
      "Started my career working with data — cleaning, analyzing, and visualizing datasets that shaped business decisions and sparked my interest in technology hiring.",
    icon: TrendingUp,
    color: "oklch(0.65 0.2 250)",
    glow: "shadow-[oklch(0.65_0.2_250)/0.4]",
    logo: rubixeLogo,
    href: "https://rubixe.com/",
  },
  {
    id: "xevyte",
    period: "Jun 2025 – Jul 2026",
    company: "Xevyte Technologies",
    role: "Technical Recruiter",
    description:
      "Moved into full-cycle technical recruiting. Sourced software engineers, ran interviews, and partnered with engineering leaders to scale teams across multiple stacks.",
    icon: Briefcase,
    color: "oklch(0.7 0.18 220)",
    glow: "shadow-[oklch(0.7_0.18_220)/0.4]",
    logo: xevyteLogo,
    href: "https://xevyte.com/",
  },
  {
    id: "hardwin",
    period: "Jul 2026 – Present",
    company: "Hardwin Software Solutions",
    role: "Talent Acquisition Specialist",
    description:
      "Leading specialized hiring for product and platform engineering teams. Focusing on high-growth startups, AI-driven sourcing, and recruiter workflow automation.",
    icon: Code2,
    color: "oklch(0.75 0.15 200)",
    glow: "shadow-[oklch(0.75_0.15_200)/0.4]",
    logo: hardwinLogo,
    href: "https://www.hardwinsoftware.com/",
  },
  {
    id: "future",
    period: "Future",
    company: "TalentOS",
    role: "Building AI Recruitment Products",
    description:
      "Combining recruitment expertise with AI to build tools that help recruiters generate JDs, analyze resumes, score candidates, and hire faster.",
    icon: Sparkles,
    color: "oklch(0.55 0.22 264)",
    glow: "shadow-[oklch(0.55_0.22_264)/0.5]",
    logo: talentosLogo,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function TimelineConnector({ color, isLast }: { color: string; isLast: boolean }) {
  if (isLast) return null;

  return (
    <div className="relative flex h-20 w-full items-center justify-center md:h-24">
      {/* Glowing vertical line */}
      <div
        className="h-full w-px md:w-0.5"
        style={{
          background: `linear-gradient(to bottom, ${color}, transparent)`,
          boxShadow: `0 0 20px 2px ${color.replace(")", "/ 0.4)")}`,
        }}
      />
      {/* Animated arrow */}
      <motion.div
        initial={{ y: -4, opacity: 0.5 }}
        animate={{ y: 8, opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0"
        style={{ color }}
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </div>
  );
}

export function CareerTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.2"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <div ref={containerRef} className="relative mx-auto max-w-5xl px-4 py-8">
      {/* Central glowing timeline rail */}
      <div className="absolute inset-y-0 left-8 w-px bg-gradient-to-b from-primary/30 via-accent/20 to-transparent md:left-1/2 md:-translate-x-px" />

      {/* Progress glow line */}
      <motion.div
        className="absolute left-8 top-0 w-px origin-top md:left-1/2 md:-translate-x-px"
        style={{
          scaleY,
          height: "100%",
          background: "linear-gradient(to bottom, oklch(0.55 0.22 264), oklch(0.78 0.15 220))",
          boxShadow: "0 0 24px 4px oklch(0.55 0.22 264 / 0.4)",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative space-y-0"
      >
        {timelineItems.map((item, index) => {
          const Icon = item.icon;
          const isLeft = index % 2 === 0;
          const isLast = index === timelineItems.length - 1;

          return (
            <motion.div key={item.id} variants={itemVariants} className="relative">
              {/* Node on the rail */}
              <div className="absolute left-8 top-8 z-20 -translate-x-1/2 md:left-1/2">
                <motion.div
                  whileInView={{ scale: [0.8, 1.1, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-background"
                  style={{ backgroundColor: item.color }}
                >
                  <div
                    className="absolute -inset-2 rounded-full opacity-60 blur-md"
                    style={{ backgroundColor: item.color }}
                  />
                  <div
                    className="absolute -inset-1 rounded-full opacity-40"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 16px ${item.color}` }}
                  />
                </motion.div>
              </div>

              {/* Connector line from rail to card */}
              <div
                className={`absolute top-9 hidden h-px bg-gradient-to-r md:block ${
                  isLeft
                    ? "left-1/2 right-[50%] to-transparent"
                    : "right-1/2 left-[50%] to-transparent"
                }`}
                style={{
                  width: "calc(50% - 3rem)",
                  background: isLeft
                    ? `linear-gradient(to right, ${item.color}, transparent)`
                    : `linear-gradient(to left, ${item.color}, transparent)`,
                  boxShadow: `0 0 12px ${item.color.replace(")", "/ 0.3)")}`,
                }}
              />

              {/* Card */}
              <div
                className={`ml-16 md:ml-0 md:flex md:items-start md:justify-${
                  isLeft ? "end" : "start"
                }`}
              >
                {(() => {
                  const CardTag: React.ElementType = item.href ? "a" : "div";
                  const linkProps = item.href
                    ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                    : {};
                  return (
                    <CardTag
                      {...linkProps}
                      className={`group relative block max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:w-[calc(50%-3rem)] ${
                        isLeft ? "md:mr-auto md:text-right" : "md:ml-auto md:text-left"
                      } ${item.href ? "cursor-pointer" : ""}`}
                      style={
                        item.href
                          ? ({ ["--tw-ring-color" as string]: item.color } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {/* Radial hover glow */}
                      <div
                        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                        style={{
                          background: `radial-gradient(circle, ${item.color} 0%, transparent 70%)`,
                        }}
                      />

                      {/* Logo header strip */}
                      {item.logo ? (
                        <div
                          className="relative flex h-24 w-full items-center justify-center overflow-hidden border-b border-white/[0.06] bg-white/[0.03]"
                          style={{
                            backgroundImage: `radial-gradient(ellipse at center, ${item.color.replace(")", "/ 0.18)")} 0%, transparent 70%)`,
                          }}
                        >
                          <img
                            src={item.logo}
                            alt={`${item.company} logo`}
                            loading="lazy"
                            className="relative z-10 max-h-14 w-auto max-w-[70%] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : null}

                      <div
                        className={`relative z-10 flex flex-col p-6 ${isLeft ? "md:items-end" : "md:items-start"}`}
                      >
                        {/* Icon chip (only when no logo header) */}
                        {!item.logo && (
                          <div
                            className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-transform duration-300 group-hover:scale-110"
                            style={{
                              boxShadow: `0 0 20px -4px ${item.color.replace(")", "/ 0.3)")}`,
                            }}
                          >
                            <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
                          </div>
                        )}

                        {/* Period */}
                        <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {item.period}
                        </span>

                        {/* Role */}
                        <h3
                          className={`mt-2 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight text-foreground ${isLeft ? "md:flex-row-reverse" : ""}`}
                        >
                          {item.role}
                          {item.href ? (
                            <ExternalLink
                              className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground"
                              strokeWidth={2}
                            />
                          ) : null}
                        </h3>

                        {/* Company */}
                        <p className="text-sm font-medium text-accent">{item.company}</p>

                        {/* Description */}
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </CardTag>
                  );
                })()}
              </div>

              {/* Downward connector to next item */}
              <TimelineConnector color={item.color} isLast={isLast} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
