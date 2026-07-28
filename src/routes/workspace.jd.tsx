import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPanel } from "@/components/workspace/ComingSoonPanel";

export const Route = createFileRoute("/workspace/jd")({
  head: () => ({
    meta: [
      { title: "JD Studio — TalentOS" },
      { name: "description", content: "Generate inclusive, high-signal job descriptions in one click." },
      { property: "og:title", content: "JD Studio — TalentOS" },
      { property: "og:description", content: "Job description generator for modern recruiters." },
    ],
  }),
  component: () => (
    <ComingSoonPanel
      title="JD Studio"
      description="Generate role-specific job descriptions tuned for top talent — responsibilities, must-haves, nice-to-haves, and inclusive language."
    />
  ),
});