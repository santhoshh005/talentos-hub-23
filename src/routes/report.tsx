import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { RecruiterReport } from "@/components/report/RecruiterReport";
import { Button } from "@/components/ui/button";
import { clearResult, useLastReport } from "@/lib/report-store";
import { downloadRecruiterReportSnapshot } from "@/lib/recruiter-report-pdf";
import { useState } from "react";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const result = useLastReport();
  const [downloading, setDownloading] = useState(false);
  const canDownload = !!result && result.ok;

  const handleDownload = async () => {
    if (!canDownload || !result) {
      toast.error("No report available to export.");
      return;
    }
    try {
      setDownloading(true);
      // Yield so the button state updates before capture begins.
      await new Promise((r) => setTimeout(r, 20));
      await downloadRecruiterReportSnapshot(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (!result || !result.ok) {
    return (
      <PageShell
        eyebrow="Intelligence Report"
        title={<>Recruiter <span className="text-gradient">Intelligence</span></>}
        description="Explainable candidate intelligence from the TalentOS pipeline — skills, evidence, and transparency."
      >
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">No report yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start from Resume Intelligence — upload a resume and paste a job description to run the TalentOS Resume Intelligence Pipeline.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate({ to: "/workspace/intelligence" })} className="gap-2">
              <Sparkles className="h-4 w-4" /> Open Resume Intelligence
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Intelligence Report"
      title={<>Recruiter <span className="text-gradient">Intelligence</span></>}
      description="Explainable candidate intelligence from the TalentOS pipeline — skills, evidence, and transparency."
    >
      <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex flex-wrap justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            title={canDownload ? "Download PDF" : "No report available to export."}
            className="gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearResult();
              navigate({ to: "/ai-lab" });
            }}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New Report
          </Button>
        </div>
        <RecruiterReport data={result} />
      </motion.div>
    </PageShell>
  );
}