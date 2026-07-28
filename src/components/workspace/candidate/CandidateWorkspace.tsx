import { useCallback, useEffect, useState } from "react";
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
import { useTemplates } from "@/lib/templates/use-templates";
import type { ClientTemplate } from "@/lib/templates/template-types";
import { CandidateUpload } from "./CandidateUpload";
import { CandidateWorkspaceSkeleton } from "./CandidateWorkspaceSkeleton";
import { CandidateSnapshot } from "./CandidateSnapshot";
import { CandidateRecordEditor } from "./CandidateRecordEditor";
import { CandidateCompleteness } from "./CandidateCompleteness";
import { TemplateSelector } from "./TemplateSelector";
import { ExportPreview } from "./ExportPreview";
import { extractResumeText } from "@/lib/resume-extract";
import { BulkCandidateTable, type BulkItem } from "./BulkCandidateTable";

type Phase = "upload" | "extracting" | "snapshot" | "edit" | "bulk";

const BULK_CONCURRENCY = 3;

export function CandidateWorkspace() {
  const extract = useServerFn(extractCandidateRecord);
  const { templates, repo } = useTemplates();

  const [phase, setPhase] = useState<Phase>("upload");
  const [record, setRecord] = useState<CandidateRecord>(emptyCandidateRecord());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);

  // Preselect first template once available
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

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
    setBulkItems([]);
    setPhase("upload");
  };

  const selectedTemplate: ClientTemplate | undefined = templates.find(
    (t) => t.id === selectedTemplateId,
  );

  const selectTemplate = (t: ClientTemplate) => {
    setSelectedTemplateId(t.id);
    repo.markRecent(t.id);
  };

  const patchBulkItem = useCallback(
    (id: string, patch: Partial<BulkItem>) =>
      setBulkItems((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [],
  );

  const editBulkRecord = useCallback(
    (id: string, patch: Partial<CandidateRecord>) =>
      setBulkItems((items) =>
        items.map((i) => (i.id === id ? { ...i, record: { ...i.record, ...patch } } : i)),
      ),
    [],
  );

  const runBulk = useCallback(
    async (files: File[]) => {
      const seeded: BulkItem[] = files.map((f, idx) => ({
        id: `${Date.now()}_${idx}_${f.name}`,
        fileName: f.name,
        status: "queued",
        record: emptyCandidateRecord(),
      }));
      setBulkItems(seeded);
      setPhase("bulk");

      const processOne = async (item: BulkItem, file: File) => {
        try {
          patchBulkItem(item.id, { status: "parsing" });
          const text = await extractResumeText(file);
          patchBulkItem(item.id, { status: "extracting" });
          const seed = parseCandidateText(text);
          const optimistic = CandidateRecordSchema.parse(mergeCandidate(seed, {}));
          patchBulkItem(item.id, { record: optimistic });
          try {
            const next = await extract({ data: { resumeText: text, seed } });
            patchBulkItem(item.id, { record: next, status: "done" });
          } catch (err) {
            console.error(err);
            patchBulkItem(item.id, {
              status: "done",
              record: optimistic,
              error: "AI extraction failed — using parsed fields",
            });
          }
        } catch (err) {
          console.error(err);
          patchBulkItem(item.id, {
            status: "failed",
            error: err instanceof Error ? err.message : "Could not read resume",
          });
        }
      };

      const queue = seeded.map((item, idx) => ({ item, file: files[idx] }));
      const workers = Array.from({ length: Math.min(BULK_CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) return;
          await processOne(next.item, next.file);
        }
      });
      await Promise.all(workers);
      toast.success("Bulk extraction complete");
    },
    [extract, patchBulkItem],
  );

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
              onBulk={(files) => void runBulk(files)}
            />
          </motion.div>
        )}

        {phase === "extracting" && (
          <motion.div key="extracting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CandidateWorkspaceSkeleton />
          </motion.div>
        )}

        {phase === "bulk" && selectedTemplate && (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <TemplateSelector selectedId={selectedTemplateId} onSelect={selectTemplate} />
            <BulkCandidateTable
              items={bulkItems}
              template={selectedTemplate}
              onReset={reset}
              onEditRecord={editBulkRecord}
            />
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
            {selectedTemplate && (
              <ExportPreview record={record} template={selectedTemplate} />
            )}
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