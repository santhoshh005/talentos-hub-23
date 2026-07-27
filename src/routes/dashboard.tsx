import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TalentOS" },
      { name: "description", content: "Recruiter dashboard with live pipeline, sourcing analytics, and AI signals." },
      { property: "og:title", content: "Dashboard — TalentOS" },
      { property: "og:description", content: "Live pipeline and analytics for modern recruiters." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Dashboard"
      title={<>Your recruiting <span className="text-gradient">command center</span></>}
      description="Track pipelines, sourcing velocity, and AI-generated candidate signals in one premium surface."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {["Active Roles", "Candidates in Pipeline", "Offers This Week"].map((t, i) => (
          <div key={t} className="glass-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{[12, 148, 6][i]}</p>
          </div>
        ))}
      </div>
    </PageShell>
  ),
});