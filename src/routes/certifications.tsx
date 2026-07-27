import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/certifications")({
  head: () => ({
    meta: [
      { title: "Certifications — TalentOS" },
      { name: "description", content: "Professional certifications and credentials in AI and technical recruitment." },
      { property: "og:title", content: "Certifications — TalentOS" },
      { property: "og:description", content: "Credentials and certifications." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Certifications"
      title={<>Credentials & <span className="text-gradient">expertise</span></>}
      description="Verified certifications across AI, sourcing, and recruitment operations."
    />
  ),
});