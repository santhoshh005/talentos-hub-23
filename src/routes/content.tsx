import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ContentLibrary } from "@/components/content/ContentLibrary";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Recruitment Insights — TalentOS" },
      {
        name: "description",
        content:
          "LinkedIn highlights on resumes, AI in hiring, and the real story behind recruitment.",
      },
      { property: "og:title", content: "Recruitment Insights — TalentOS" },
      { property: "og:description", content: "Fresh thinking from the recruiting frontlines." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Content"
      title={
        <>
          Recruitment <span className="text-gradient">Insights</span>
        </>
      }
      description="LinkedIn highlights on resumes, AI in hiring, and the real story behind recruitment."
    >
      <ContentLibrary />
    </PageShell>
  ),
});
