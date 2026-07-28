import { useCallback, useState } from "react";
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
import { parseCandidateText, mergeCandidate } from "@/lib/candidate-parse";
import { CandidateRecordSchema } from "@/lib/candidate-schemas";
import { CandidateUpload } from "./CandidateUpload";
import { CandidateWorkspaceSkeleton } from "./CandidateWorkspaceSkeleton";
import { CandidateSnapshot } from "./CandidateSnapshot";
import { CandidateRecordEditor } from "./CandidateRecordEditor";
import { CandidateCompleteness } from "./CandidateCompleteness";
import { ExportPreview } from "./ExportPreview";

type Phase = "upload" | "extracting" | "snapshot" | "edit";

export function CandidateWorkspace() {
  const extract = useServerFn(extractCandidateRecord);

  const [phase, setPhase] = useState<Phase>("upload");
  const [record, setRecord] = useState<CandidateRecord>(emptyCandidateRecord());

  const onExtracted = useCallback(
    async (resumeText: string) => {
      setPhase("extracting");

      // Deterministic parse first — recruiter sees something even if LLM fails.
      const seed = parseCandidateText(resumeText);
      const optimistic = CandidateRecordSchema.parse(mergeCandidate(seed, {}));
      setRecord(optimistic);

      try {
        const next = await extract({ data: { resumeText, seed } });
        setRecord(next);
        setTimeout(() => setPhase("snapshot"), 350);
      } catch (err) {
        console.error(err);
        toast.error("AI extraction failed. Showing parsed fields — edit anything before export.");
        setPhase("snapshot");
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
            <CandidateWorkspaceSkeleton />
          </motion.div>
        )}

        {phase === "snapshot" && (
          <motion.div
            key="snapshot"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <CandidateSnapshot record={record} onContinue={() => setPhase("edit")} onReset={reset} />
            <ExportPreview record={record} />
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
            </aside>

            <div className="lg:col-span-2">
              <ExportPreview record={record} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}