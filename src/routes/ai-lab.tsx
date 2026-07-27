import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { AiLabHero } from "@/components/ai-lab/AiLabHero";
import { AiLabCards } from "@/components/ai-lab/AiLabCards";

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
    <AppLayout>
      <AiLabHero />
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <AiLabCards />
      </section>
    </AppLayout>
  ),
});