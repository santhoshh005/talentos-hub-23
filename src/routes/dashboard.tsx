import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { DashboardSection } from "@/components/home/DashboardSection";

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
      <div className="-mx-4 sm:-mx-6">
        <DashboardSection />
      </div>
    </PageShell>
  ),
});