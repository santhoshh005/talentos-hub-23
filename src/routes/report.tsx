import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { RecruiterReport } from "@/components/report/RecruiterReport";
import { getReportData } from "@/lib/report-demo";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Recruiter Intelligence Report — TalentOS" },
      { name: "description", content: "A premium recruiter-grade intelligence report powered by the TalentOS Resume Intelligence Pipeline." },
      { property: "og:title", content: "Recruiter Intelligence Report — TalentOS" },
      { property: "og:description", content: "Explainable candidate intelligence: skills, evidence, pipeline transparency." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const data = getReportData();
  return (
    <PageShell
      eyebrow="Intelligence Report"
      title={<>Recruiter <span className="text-gradient">Intelligence</span></>}
      description="Explainable candidate intelligence from the TalentOS pipeline — skills, evidence, and transparency."
    >
      <RecruiterReport data={data} />
    </PageShell>
  );
}