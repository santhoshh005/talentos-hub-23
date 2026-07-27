import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — TalentOS" },
      { name: "description", content: "A chronological journey through Hemanth Kumar's recruitment career and milestones." },
      { property: "og:title", content: "Timeline — TalentOS" },
      { property: "og:description", content: "Career journey and milestones." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Timeline"
      title={<>A journey through <span className="text-gradient">technical recruiting</span></>}
      description="Milestones, roles, and impact across years of specialised hiring."
    />
  ),
});