import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content — TalentOS" },
      { name: "description", content: "Articles, talks, and playbooks on modern AI-powered recruitment." },
      { property: "og:title", content: "Content — TalentOS" },
      { property: "og:description", content: "Writing on the future of recruiting." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Content"
      title={<>Writing on the <span className="text-gradient">future of hiring</span></>}
      description="Articles, talks, and playbooks distilled from years in the field."
    />
  ),
});