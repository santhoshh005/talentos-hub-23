import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPanel } from "@/components/workspace/ComingSoonPanel";

export const Route = createFileRoute("/workspace/boolean")({
  head: () => ({
    meta: [
      { title: "Boolean Search Builder — TalentOS" },
      {
        name: "description",
        content: "Craft powerful sourcing strings for LinkedIn, GitHub, and niche talent pools.",
      },
      { property: "og:title", content: "Boolean Search Builder — TalentOS" },
      {
        property: "og:description",
        content: "Boolean strings tuned for modern sourcing workflows.",
      },
    ],
  }),
  component: () => (
    <ComingSoonPanel
      title="Boolean Search Builder"
      description="Turn a plain-language brief into boolean queries for LinkedIn, GitHub, and niche talent pools — with synonyms and negatives handled."
    />
  ),
});
