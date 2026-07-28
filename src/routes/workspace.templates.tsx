import { createFileRoute } from "@tanstack/react-router";
import { TemplateManager } from "@/components/workspace/templates/TemplateManager";

export const Route = createFileRoute("/workspace/templates")({
  head: () => ({
    meta: [
      { title: "Client Templates — TalentOS" },
      {
        name: "description",
        content:
          "Design and reuse Excel templates for every client. Drag-and-drop column mapping, custom labels, and default values.",
      },
      { property: "og:title", content: "Client Templates — TalentOS" },
      {
        property: "og:description",
        content: "Reusable Excel templates that adapt candidate exports to every client's format.",
      },
    ],
  }),
  component: () => <TemplateManager />,
});