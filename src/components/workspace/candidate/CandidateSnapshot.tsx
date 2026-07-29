import { motion } from "framer-motion";
import { ArrowRight, Building2, MapPin, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CandidateRecord } from "@/lib/candidate-schemas";
import { display } from "@/lib/candidate-display";

export function CandidateSnapshot({
  record,
  onContinue,
  onReset,
}: {
  record: CandidateRecord;
  onContinue: () => void;
  onReset: () => void;
}) {
  const skills = (
    record.primarySkills.length ? record.primarySkills : record.secondarySkills
  ).slice(0, 6);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl"
    >
      <div className="bg-gradient-to-br from-primary/15 via-transparent to-accent/10 px-6 py-6 md:px-8 md:py-8">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-semibold uppercase text-white shadow-2xl shadow-primary/30">
            {(record.fullName || "?").slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Candidate snapshot
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              {record.fullName || "Unnamed candidate"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[record.currentDesignation, record.totalExperience].filter(Boolean).join(" · ") ||
                "Ready to edit"}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={Building2} label="Current company" value={display(record.currentCompany)} />
          <Stat icon={User} label="Email" value={display(record.email)} />
          <Stat icon={MapPin} label="Location" value={display(record.currentLocation)} />
        </dl>

        {skills.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Primary skills
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-foreground/90"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4 md:px-8">
        <div className="text-xs text-muted-foreground">
          Snapshot is auto-generated. You can edit every field next.
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-lg border-white/10 bg-white/[0.03]"
          >
            Upload another
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="group rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30"
          >
            <Sparkles className="h-4 w-4" /> Continue editing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm text-foreground/90">{value || "NA"}</div>
    </div>
  );
}
