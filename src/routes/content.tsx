import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ContentLibrary } from "@/components/content/ContentLibrary";

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
      title={<>Recruitment <span className="text-gradient">Insights</span></>}
      description="LinkedIn highlights on resumes, AI in hiring, and the real story behind recruitment."
    >
      <ContentLibrary />
    </PageShell>
  ),
});