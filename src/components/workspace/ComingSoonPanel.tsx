import { Lock } from "lucide-react";

export function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-accent/10">
        <Lock className="h-6 w-6 text-accent" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Coming Soon
      </span>
    </div>
  );
}