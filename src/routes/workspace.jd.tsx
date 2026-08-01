import { createFileRoute } from "@tanstack/react-router";
import { JDStudioWorkspace } from "@/components/workspace/jd/JDStudioWorkspace";

export const Route = createFileRoute("/workspace/jd")({
  head: () => ({
    meta: [
      { title: "JD Studio — TalentOS" },
      {
        name: "description",
        content: "Generate inclusive, high-signal job descriptions in one click.",
      },
      { property: "og:title", content: "JD Studio — TalentOS" },
      { property: "og:description", content: "Job description generator for modern recruiters." },
    ],
  }),
  component: () => (
    <div>
      <SectionHeader
        eyebrow="JD Studio"
        title="Generate High-Signal Job Descriptions"
        description="Define the role, select a tone, and instantly generate a beautifully formatted, inclusive job description ready to post."
      />
      <JDStudioWorkspace />
    </div>
  ),
});

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
