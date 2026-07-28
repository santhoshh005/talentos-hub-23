import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPanel } from "@/components/workspace/ComingSoonPanel";

export const Route = createFileRoute("/workspace/interview")({
  head: () => ({
    meta: [
      { title: "Interview Studio — TalentOS" },
      { name: "description", content: "Generate role-specific interview kits calibrated to level and charter." },
      { property: "og:title", content: "Interview Studio — TalentOS" },
      { property: "og:description", content: "Role-specific interview kits for modern recruiters." },
    ],
  }),
  component: () => (
    <ComingSoonPanel
      title="Interview Studio"
      description="Generate technical, behavioral, and scenario-based questions calibrated to the candidate's level and the role's charter."
    />
  ),
});