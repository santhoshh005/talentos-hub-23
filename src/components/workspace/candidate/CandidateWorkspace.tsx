import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractCandidateRecord } from "@/lib/candidate-extract.functions";
import {
  emptyCandidateRecord,
  type CandidateRecord,
} from "@/lib/candidate-schemas";
import { useTemplates } from "@/lib/templates/use-templates";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { CandidateUpload } from "./CandidateUpload";
import { CandidateExtractionProgress } from "./CandidateExtractionProgress";
import { CandidateSnapshot } from "./CandidateSnapshot";
import { CandidateRecordEditor } from "./CandidateRecordEditor";
import { CandidateCompleteness } from "./CandidateCompleteness";
import { TemplateSelector } from "./TemplateSelector";
import { ExportPreview } from "./ExportPreview";

type Phase = "upload" | "extracting" | "snapshot" | "edit";

export function CandidateWorkspace() {
  const extract = useServerFn(extractCandidateRecord);
  const { templates, repo } = useTemplates();

  const [phase, setPhase] = useState<Phase>("upload");
  const [record, setRecord] = useState<CandidateRecord>(emptyCandidateRecord());
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  // Preselect first template once available
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const onExtracted = useCallback(
    async (resumeText: string) => {
      setPhase("extracting");
      setActiveStep(0);
      clearTimer();
      stepTimerRef.current = setInterval(() => {
        setActiveStep((s) => (s < 3 ? s + 1 : s));
      }, 800);

      try {
        const next = await extract({ data: { resumeText } });
        clearTimer();
        setActiveStep(4);
        setRecord(next);
        setTimeout(() => setPhase("snapshot"), 350);
      } catch (err) {
        clearTimer();
        console.error(err);
        toast.error("Extraction failed. You can still edit fields manually.");
        setRecord(emptyCandidateRecord());
        setPhase("edit");
      }
    },
    [extract],
  );

  const update = useCallback(
    <K extends keyof CandidateRecord>(key: K, value: CandidateRecord[K]) =>
      setRecord((r) => ({ ...r, [key]: value })),
    [],
  );

  const reset = () => {
    setRecord(emptyCandidateRecord());
    setPhase("upload");
  };

  const selectedTemplate: ClientTemplate | undefined = templates.find(
    (t) => t.id === selectedTemplateId,
  );

  const selectTemplate = (t: ClientTemplate) => {
    setSelectedTemplateId(t.id);
    repo.markRecent(t.id);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {phase === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CandidateUpload
              busy={false}
              onExtracted={(text) => void onExtracted(text)}
            />
          </motion.div>
        )}

        {phase === "extracting" && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CandidateExtractionProgress activeStep={activeStep} />
          </motion.div>
        )}

        {phase === "snapshot" && (
          <motion.div key="snapshot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CandidateSnapshot record={record} onContinue={() => setPhase("edit")} onReset={reset} />
          </motion.div>
        )}

        {phase === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="min-w-0 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Editable candidate record</h2>
                <Button type="button" variant="outline" onClick={reset} className="rounded-lg border-white/10 bg-white/[0.03]">
                  <RotateCcw className="h-4 w-4" /> Start over
                </Button>
              </div>
              <CandidateRecordEditor record={record} update={update} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <CandidateCompleteness record={record} />
              <TemplateSelector selectedId={selectedTemplateId} onSelect={selectTemplate} />
            </aside>

            {selectedTemplate && (
              <div className="lg:col-span-2">
                <ExportPreview record={record} template={selectedTemplate} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}