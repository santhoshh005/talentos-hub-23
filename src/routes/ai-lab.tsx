import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/ai-lab")({
  head: () => ({
    meta: [
      { title: "AI Lab — TalentOS" },
      { name: "description", content: "Experiment with AI-powered sourcing agents, JD generators, and candidate matching." },
      { property: "og:title", content: "AI Lab — TalentOS" },
      { property: "og:description", content: "AI experiments for recruitment workflows." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="AI Lab"
      title={<>Experiments in <span className="text-gradient">applied AI</span></>}
      description="A sandbox of AI-powered tools shaping the future of technical recruiting."
    />
  ),
});