import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ContactSection } from "@/components/contact/ContactSection";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — TalentOS" },
      { name: "description", content: "Get in touch with Hemanth Kumar about TalentOS, AI recruitment, and collaborations." },
      { property: "og:title", content: "Contact — TalentOS" },
      { property: "og:description", content: "Reach out about recruitment and collaborations." },
    ],
  }),
  component: () => (
    <PageShell
      eyebrow="Contact"
      title={<>Let's <span className="text-gradient">build together</span></>}
      description="Have a role, project, or partnership in mind? Get in touch."
    >
      <ContactSection />
    </PageShell>
  ),
});