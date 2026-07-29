import { createFileRoute } from "@tanstack/react-router";
import { CandidateWorkspace } from "@/components/workspace/candidate/CandidateWorkspace";

export const Route = createFileRoute("/workspace/candidate")({
  head: () => ({
    meta: [
      { title: "Candidate Workspace — TalentOS" },
      {
        name: "description",
        content:
          "Extract candidate details from any resume, edit the record inline, and export into a client Excel template in under two minutes.",
      },
      { property: "og:title", content: "Candidate Workspace — TalentOS" },
      {
        property: "og:description",
        content: "Extract • Edit • Export — the flagship recruiter workflow of TalentOS.",
      },
    ],
  }),
  component: () => (
    <div>
      <SectionHeader
        eyebrow="Candidate Workspace"
        title="Extract • Edit • Export"
        description="Upload a resume, review the AI-extracted candidate record, and export into any client template."
      />
      <CandidateWorkspace />
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
