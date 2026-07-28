import { candidateCompleteness } from "@/lib/candidate-schemas";
import type { CandidateRecord } from "@/lib/candidate-schemas";

export function CandidateCompleteness({ record }: { record: CandidateRecord }) {
  const { percent, missing } = candidateCompleteness(record);
  const color = percent >= 85 ? "emerald" : percent >= 60 ? "amber" : "rose";
  const barColor =
    color === "emerald"
      ? "from-emerald-500 to-emerald-300"
      : color === "amber"
      ? "from-amber-500 to-amber-300"
      : "from-rose-500 to-rose-300";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Candidate completeness
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{percent}%</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {missing.length === 0 ? "All core fields filled" : `${missing.length} field${missing.length === 1 ? "" : "s"} missing`}
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {missing.map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}