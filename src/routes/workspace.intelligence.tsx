import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeAnalyzerModal } from "@/components/ai-lab/ResumeAnalyzerModal";

export const Route = createFileRoute("/workspace/intelligence")({
  head: () => ({
    meta: [
      { title: "Resume Intelligence — TalentOS" },
      {
        name: "description",
        content:
          "Match a resume against any Job Description with explainable scoring, evidence, and a downloadable recruiter report.",
      },
      { property: "og:title", content: "Resume Intelligence — TalentOS" },
      {
        property: "og:description",
        content: "Explainable resume ↔ JD matching with evidence, scoring, and a branded PDF report.",
      },
    ],
  }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Resume Intelligence</div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Match resumes against any JD</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Deterministic scoring backed by an AI evidence engine, transparent pipeline, and a downloadable
          recruiter report.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Match Score", desc: "Weighted skill coverage plus evidence-based signals." },
          { title: "Evidence Engine", desc: "Every skill grounded in resume phrases and tenure." },
          { title: "Recruiter Report", desc: "Branded, PDF-exportable candidate assessment." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 p-5 backdrop-blur-xl">
        <div>
          <div className="text-sm font-semibold">Run Resume Intelligence</div>
          <div className="text-xs text-muted-foreground">
            Upload a resume, paste or upload the JD, and receive a full recruiter report.
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30"
        >
          <Sparkles className="h-4 w-4" /> Launch Resume Intelligence
        </Button>
      </div>

      <ResumeAnalyzerModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}