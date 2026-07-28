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
const STORAGE_KEY = "talentos:candidate-workspace:v1";

interface PersistedState {
  phase: Phase;
  record: CandidateRecord;
  bulkItems: BulkItem[];
  selectedTemplateId?: string;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Any in-flight items no longer have their File; mark as failed so recruiter can re-upload.
    const bulkItems = (parsed.bulkItems ?? []).map((i) =>
      i.status === "done" || i.status === "failed"
        ? i
        : { ...i, status: "failed" as const, error: "Interrupted — re-upload to retry" },
    );
    return { ...parsed, bulkItems };
  } catch {
    return null;
  }
}

function savePersisted(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

function clearPersisted() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function CandidateWorkspace() {
  const extract = useServerFn(extractCandidateRecord);
  const { templates, repo } = useTemplates();

  const initial = useRef<PersistedState | null>(loadPersisted());
  const [phase, setPhase] = useState<Phase>(initial.current?.phase ?? "upload");
  const [record, setRecord] = useState<CandidateRecord>(initial.current?.record ?? emptyCandidateRecord());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    initial.current?.selectedTemplateId,
  );
  const [bulkItems, setBulkItems] = useState<BulkItem[]>(initial.current?.bulkItems ?? []);

  // Preselect first template once available
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Persist workspace state so navigating to Templates and back does not wipe the batch.
  useEffect(() => {
    if (phase === "upload" && bulkItems.length === 0 && !record.fullName) {
      clearPersisted();
      return;
    }
    savePersisted({ phase, record, bulkItems, selectedTemplateId });
  }, [phase, record, bulkItems, selectedTemplateId]);

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
    clearPersisted();
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

  const processFiles = useCallback(
    async (pairs: { item: BulkItem; file: File }[]) => {
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
      const queue = [...pairs];
      const workers = Array.from({ length: Math.min(BULK_CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) return;
          await processOne(next.item, next.file);
        }
      });
      await Promise.all(workers);
    },
    [extract, patchBulkItem],
  );

  const seedFrom = (files: File[]): BulkItem[] =>
    files.map((f, idx) => ({
      id: `${Date.now()}_${idx}_${f.name}`,
      fileName: f.name,
      status: "queued",
      record: emptyCandidateRecord(),
    }));

  const runBulk = useCallback(
    async (files: File[]) => {
      const seeded = seedFrom(files);
      setBulkItems(seeded);
      setPhase("bulk");
      await processFiles(seeded.map((item, idx) => ({ item, file: files[idx] })));
      toast.success("Bulk extraction complete");
    },
    [processFiles],
  );

  const appendBulk = useCallback(
    async (files: File[]) => {
      const seeded = seedFrom(files);
      setBulkItems((items) => [...items, ...seeded]);
      setPhase("bulk");
      await processFiles(seeded.map((item, idx) => ({ item, file: files[idx] })));
      toast.success(`Added ${files.length} resume${files.length === 1 ? "" : "s"}`);
    },
    [processFiles],
  );

  const promoteAndAppend = useCallback(
    async (files: File[]) => {
      // Convert current single record into first bulk item, then append and process new files.
      const singleItem: BulkItem = {
        id: `${Date.now()}_single`,
        fileName: record.fullName ? `${record.fullName}.pdf` : "Current candidate",
        status: "done",
        record,
      };
      const seeded = seedFrom(files);
      setBulkItems([singleItem, ...seeded]);
      setPhase("bulk");
      await processFiles(seeded.map((item, idx) => ({ item, file: files[idx] })));
      toast.success(`Added ${files.length} resume${files.length === 1 ? "" : "s"}`);
    },
    [processFiles, record],
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
              onAddFiles={(files) => void appendBulk(files)}
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
            <CandidateSnapshot
              record={record}
              onContinue={() => setPhase("edit")}
              onReset={reset}
              onAddMore={(files) => void promoteAndAppend(files)}
            />
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
                <div className="flex gap-2">
                  <AddMoreButton onAdd={(files) => void promoteAndAppend(files)} />
                  <Button type="button" variant="outline" onClick={reset} className="rounded-lg border-white/10 bg-white/[0.03]">
                    <RotateCcw className="h-4 w-4" /> Start over
                  </Button>
                </div>
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