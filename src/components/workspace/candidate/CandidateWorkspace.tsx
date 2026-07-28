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

type Phase = "upload" | "extracting" | "snapshot" | "edit";

const STORAGE_KEY = "talentos:candidate-workspace:v1";

interface PersistedState {
  phase: Phase;
  record: CandidateRecord;
  selectedTemplateId?: string;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState> & { phase?: string };
    const record = CandidateRecordSchema.parse(parsed.record ?? {});
    const phase: Phase = parsed.phase === "snapshot" || parsed.phase === "edit"
      ? parsed.phase
      : record.fullName
      ? "snapshot"
      : "upload";
    return { phase, record, selectedTemplateId: parsed.selectedTemplateId };
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

  // Preselect first template once available
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Persist the single-candidate workspace so navigating to Templates and back keeps the parsed record.
  useEffect(() => {
    if (phase === "upload" && !record.fullName) {
      clearPersisted();
      return;
    }
    savePersisted({ phase, record, selectedTemplateId });
  }, [phase, record, selectedTemplateId]);

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
    clearPersisted();
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
            <CandidateUpload busy={false} onExtracted={(text) => void onExtracted(text)} />
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
            <CandidateSnapshot
              record={record}
              onContinue={() => setPhase("edit")}
              onReset={reset}
            />
            {selectedTemplate && (
              <ExportPreview
                record={record}
                template={selectedTemplate}
                onUpdateTemplate={(patch) => {
                  repo.update(selectedTemplate.id, patch);
                  toast.success("Template updated");
                }}
              />
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
                <ExportPreview
                  record={record}
                  template={selectedTemplate}
                  onUpdateTemplate={(patch) => {
                    repo.update(selectedTemplate.id, patch);
                    toast.success("Template updated");
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}