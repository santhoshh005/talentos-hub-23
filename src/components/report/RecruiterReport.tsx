import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ChevronDown,
  Briefcase,
  GraduationCap,
  Award,
  FolderKanban,
  Clock,
  Cpu,
  FileSearch,
  Brain,
  Layers,
  Target,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineResult } from "@/lib/pipeline.functions";

type Tone = "emerald" | "sky" | "amber" | "rose";

const toneStyles: Record<Tone, { badge: string; ring: string; dot: string }> = {
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
    ring: "ring-emerald-400/30",
    dot: "bg-emerald-400",
  },
  sky: {
    badge: "bg-sky-500/10 text-sky-300 border-sky-400/30",
    ring: "ring-sky-400/30",
    dot: "bg-sky-400",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-300 border-amber-400/30",
    ring: "ring-amber-400/30",
    dot: "bg-amber-400",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-300 border-rose-400/30",
    ring: "ring-rose-400/30",
    dot: "bg-rose-400",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl",
        "shadow-[0_10px_40px_-12px_rgba(37,99,235,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="rounded-xl border border-white/10 bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function RecruiterReport({ data }: { data: PipelineResult }) {
  if (!data.ok) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <p className="font-medium">Pipeline halted at stage: {data.failedStage}</p>
        <p className="mt-1 text-sm text-muted-foreground">{data.error.message}</p>
      </GlassCard>
    );
  }

  const { resume, jobDescription, matching, evidence, metadata, scoring, intelligence } = data;
  if (!scoring || !intelligence) {
    return (
      <GlassCard className="p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <p className="font-medium">This report was generated before the latest engines shipped.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please re-run the Resume Intelligence tool to regenerate the report.
        </p>
      </GlassCard>
    );
  }
  const matchPct = scoring.matchPercentage;
  const rec = intelligence.recommendation;
  const tone = toneStyles[rec.tone];

  return (
    <div id="recruiter-report-root" className="space-y-10">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}>
        <GlassCard className="p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 text-lg font-semibold ring-1",
                  tone.ring,
                )}
              >
                {resume.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Candidate
                </div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{resume.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {jobDescription.jobTitle}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    {intelligence.inferredDomain}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {resume.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <ScoreRing value={matchPct} tone={rec.tone} />
              <div className="flex flex-col items-start gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                    tone.badge,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                  {rec.label}
                </span>
                <p className="max-w-[220px] text-xs text-muted-foreground">{rec.description}</p>
                <div className="mt-1 flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Skills {scoring.skillCoverage}%</span>
                  <span>Evidence {scoring.evidenceScore}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-6 md:grid-cols-4">
            <MetaStat icon={Mail} label="Email" value={resume.email} />
            <MetaStat icon={Phone} label="Phone" value={resume.phone} />
            <MetaStat icon={Clock} label="Notice" value={resume.noticePeriod} />
            <MetaStat icon={ShieldCheck} label="Seniority" value={intelligence.inferredSeniority} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Section 1: Executive Summary */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader eyebrow="Section 1" title="Executive Summary" icon={Sparkles} />
        <GlassCard className="p-6 md:p-8">
          <p className="text-base leading-relaxed text-foreground/90">{intelligence.summary}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InsightList
              title="Strengths"
              icon={TrendingUp}
              tone="emerald"
              items={intelligence.strengths}
            />
            <InsightList title="Risks" icon={ShieldAlert} tone="rose" items={intelligence.risks} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Section 2: Skill Analysis */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader
          eyebrow="Section 2"
          title="Skill Analysis"
          icon={Target}
          description="Deterministic comparison from the Matching Engine."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <SkillColumn
            title="Matching Skills"
            icon={CheckCircle2}
            tone="emerald"
            count={matching.matchingSkills.length}
          >
            {matching.matchingSkills.map((m, i) => (
              <SkillChip
                key={m.skill}
                label={m.skill}
                tone="emerald"
                tooltip={`Confidence ${m.confidence} · ${m.kind}`}
                delay={i * 0.03}
              />
            ))}
          </SkillColumn>
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="text-sm font-medium">Missing Skills</span>
              </div>
              <span
                className={cn("rounded-full border px-2 py-0.5 text-xs", toneStyles.rose.badge)}
              >
                {matching.missingSkills.length}
              </span>
            </div>
            {matching.missingSkills.length === 0 ? (
              <span className="text-xs text-muted-foreground">None</span>
            ) : (
              <div className="space-y-3">
                {intelligence.missingByCategory.map((group) => (
                  <div key={group.category}>
                    <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {group.category}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((s, i) => (
                        <SkillChip
                          key={s}
                          label={s}
                          tone="rose"
                          tooltip="Required by JD, absent in resume"
                          delay={i * 0.02}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
          <SkillColumn
            title="Additional Skills"
            icon={PlusCircle}
            tone="sky"
            count={matching.additionalSkills.length}
          >
            {matching.additionalSkills.map((s, i) => (
              <SkillChip
                key={s}
                label={s}
                tone="sky"
                tooltip="Present in resume, not requested by JD"
                delay={i * 0.03}
              />
            ))}
          </SkillColumn>
        </div>
      </motion.div>

      {/* Section 3: Evidence Analysis */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader
          eyebrow="Section 3"
          title="Evidence Analysis"
          icon={FileSearch}
          description="Where each matched skill is supported in the resume."
        />
        <div className="grid gap-3 md:grid-cols-2">
          {evidence.map((e, i) => (
            <EvidenceCard key={e.skill} evidence={e} index={i} />
          ))}
        </div>
      </motion.div>

      {/* Section 4: Candidate Profile */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader eyebrow="Section 4" title="Candidate Profile" icon={Briefcase} />
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileCard icon={Clock} title="Experience">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-medium">{resume.experience}</p>
            <p className="mt-3 text-sm text-muted-foreground">Relevant</p>
            <p className="text-lg font-medium">{resume.relevantExperience}</p>
          </ProfileCard>
          <ProfileCard icon={GraduationCap} title="Education">
            <ul className="space-y-2 text-sm">
              {resume.educationHistory.length > 0 ? (
                resume.educationHistory.map((e, i) => (
                  <li key={i} className="text-foreground/90">
                    {e}
                  </li>
                ))
              ) : (
                <li className="text-foreground/90">{resume.education}</li>
              )}
            </ul>
          </ProfileCard>
          <ProfileCard icon={Award} title="Certifications">
            <ul className="space-y-2 text-sm">
              {resume.certifications.length > 0 ? (
                resume.certifications.map((c, i) => (
                  <li key={i} className="text-foreground/90">
                    • {c}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Not Found</li>
              )}
            </ul>
          </ProfileCard>
          <ProfileCard icon={Briefcase} title="Employment Timeline">
            <ol className="relative space-y-3 border-l border-white/10 pl-4 text-sm">
              {resume.employmentHistory.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                  <span className="text-foreground/90">{e}</span>
                </li>
              ))}
            </ol>
          </ProfileCard>
          <ProfileCard icon={FolderKanban} title="Projects" className="md:col-span-2">
            <ul className="grid gap-2 text-sm md:grid-cols-2">
              {resume.projects.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-foreground/90"
                >
                  {p}
                </li>
              ))}
            </ul>
          </ProfileCard>
        </div>
      </motion.div>

      {/* Section 5: Pipeline Transparency */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader
          eyebrow="Section 5"
          title="Pipeline Transparency"
          icon={Cpu}
          description="Every stage that produced this report."
        />
        <GlassCard className="p-6 md:p-8">
          <ol className="grid gap-3 md:grid-cols-5">
            {metadata.stages.map((s, i) => (
              <PipelineStageCard
                key={s.stage}
                name={String(s.stage)}
                durationMs={s.durationMs}
                ok={s.ok}
                index={i}
              />
            ))}
          </ol>
          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-muted-foreground">
            <span>Pipeline v{metadata.version}</span>
            <span>Total: {formatMs(metadata.totalDurationMs)}</span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Section 6: Future AI Insights */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
      >
        <SectionHeader
          eyebrow="Section 6"
          title="Future AI Insights"
          icon={Brain}
          description="Plug-in intelligence services arriving next."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_INSIGHTS.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassCard className="relative overflow-hidden p-5 opacity-70">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_60%)]" />
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-accent">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Lock className="h-3 w-3" /> Coming Soon
                  </span>
                </div>
                <div className="text-base font-medium">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------- Subcomponents ---------------------- */

function MetaStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function ScoreRing({ value, tone }: { value: number; tone: Tone }) {
  const size = 92;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const strokeColors: Record<Tone, string> = {
    emerald: "#34d399",
    sky: "#38bdf8",
    amber: "#fbbf24",
    rose: "#fb7185",
  };
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColors[tone]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${(value / 100) * c} ${c}` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{value}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Match</span>
      </div>
    </div>
  );
}

function SkillColumn({
  title,
  icon: Icon,
  tone,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  tone: Tone;
  count: number;
  children: React.ReactNode;
}) {
  const t = toneStyles[tone];
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "emerald" && "text-emerald-400",
              tone === "rose" && "text-rose-400",
              tone === "sky" && "text-sky-400",
            )}
          />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs", t.badge)}>{count}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {count === 0 ? <span className="text-xs text-muted-foreground">None</span> : children}
      </div>
    </GlassCard>
  );
}

function SkillChip({
  label,
  tone,
  tooltip,
  delay,
}: {
  label: string;
  tone: Tone;
  tooltip?: string;
  delay: number;
}) {
  const t = toneStyles[tone];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ y: -2 }}
      title={tooltip}
      className={cn(
        "cursor-default rounded-full border px-2.5 py-1 text-xs font-medium transition-shadow",
        t.badge,
        "hover:shadow-[0_0_20px_-4px_currentColor]",
      )}
    >
      {label}
    </motion.span>
  );
}

function EvidenceCard({
  evidence,
  index,
}: {
  evidence: {
    skill: string;
    evidenceStrength: number;
    foundIn: string[];
    occurrenceCount: number;
    yearsReferenced: number;
  };
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const strengthTone =
    evidence.evidenceStrength >= 80 ? "emerald" : evidence.evidenceStrength >= 60 ? "sky" : "amber";
  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <GlassCard className="overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{evidence.skill}</span>
              <span
                className={cn(
                  "text-xs",
                  toneStyles[strengthTone].badge,
                  "rounded-full border px-2 py-0.5",
                )}
              >
                {evidence.evidenceStrength}/100
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${evidence.evidenceStrength}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "h-full rounded-full",
                  strengthTone === "emerald" && "bg-emerald-400",
                  strengthTone === "sky" && "bg-sky-400",
                  strengthTone === "amber" && "bg-amber-400",
                )}
              />
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/5"
            >
              <div className="grid grid-cols-3 gap-3 p-4 text-sm">
                <EvidenceStat label="Occurrences" value={String(evidence.occurrenceCount)} />
                <EvidenceStat label="Years Ref." value={`${evidence.yearsReferenced}`} />
                <EvidenceStat label="Sections" value={String(evidence.foundIn.length)} />
                <div className="col-span-3">
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Found In
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {evidence.foundIn.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

function EvidenceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function InsightList({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: React.ElementType;
  tone: Tone;
  items: string[];
}) {
  const t = toneStyles[tone];
  return (
    <div className={cn("rounded-xl border p-4", t.badge)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-foreground/90">
            <span className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", t.dot)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </GlassCard>
  );
}

function PipelineStageCard({
  name,
  durationMs,
  ok,
  index,
}: {
  name: string;
  durationMs: number;
  ok: boolean;
  index: number;
}) {
  const label = STAGE_LABELS[name] ?? name;
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.4 }}
      className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.12 + 0.2, duration: 0.5 }}
        className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_60%)]"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Stage {index + 1}
          </span>
          {ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          )}
        </div>
        <div className="mt-2 text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{formatMs(durationMs)}</div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-emerald-300/80">
          Completed
        </div>
      </div>
    </motion.li>
  );
}

const STAGE_LABELS: Record<string, string> = {
  resumeParser: "Resume Parser",
  jdIntelligence: "JD Intelligence",
  skillNormalization: "Skill Normalization",
  matching: "Matching Engine",
  evidence: "Evidence Engine",
  scoring: "Scoring Engine",
  recruiterIntelligence: "Recruiter Intelligence",
};

const FUTURE_INSIGHTS = [
  {
    title: "Recruiter Intelligence",
    description: "AI-authored fit summary, risks, and hiring rationale.",
    icon: Brain,
  },
  {
    title: "Interview Questions",
    description: "Role-calibrated technical & behavioral question sets.",
    icon: Sparkles,
  },
  {
    title: "Salary Benchmark",
    description: "Market-aware compensation bands for the role and region.",
    icon: Target,
  },
  {
    title: "Career Progression",
    description: "Predicted next-role trajectory and skill trend signals.",
    icon: Layers,
  },
  {
    title: "Notice Period Risk",
    description: "Availability risk scoring and joining likelihood.",
    icon: Clock,
  },
  {
    title: "Culture Fit",
    description: "Signals across communication, ownership, and values.",
    icon: ShieldCheck,
  },
];

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "<1 ms";
  if (ms < 1) return "<1 ms";
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${Math.round(ms)} ms`;
}
