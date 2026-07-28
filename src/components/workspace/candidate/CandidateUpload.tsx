import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Files, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { extractResumeText } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";

const BULK_LIMIT = 25;
const SIZE_LIMIT = 10 * 1024 * 1024;

export function validateResumeFiles(files: File[]): File[] {
  const good: File[] = [];
  for (const f of files) {
    const lower = f.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      toast.error(`${f.name}: only PDF or DOCX allowed.`);
      continue;
    }
    if (f.size > SIZE_LIMIT) {
      toast.error(`${f.name}: over 10 MB.`);
      continue;
    }
    good.push(f);
  }
  return good.slice(0, BULK_LIMIT);
}

/** Small reusable "Add more resumes" button that opens a file picker and returns validated File[]. */
export function AddResumesButton({
  onFiles,
  label = "Add more resumes",
  className,
}: {
  onFiles: (files: File[]) => void;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => ref.current?.click()}
        className={cn("rounded-lg border-white/10 bg-white/[0.03]", className)}
      >
        <Plus className="h-4 w-4" /> {label}
      </Button>
      <input
        ref={ref}
        type="file"
        multiple
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (!files.length) return;
          const valid = validateResumeFiles(files);
          if (valid.length) onFiles(valid);
        }}
      />
    </>
  );
}

export function CandidateUpload({
  onExtracted,
  onBulk,
  busy,
}: {
  onExtracted: (text: string, fileName: string) => void;
  onBulk?: (files: File[]) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const process = useCallback(
    async (file: File) => {
      setReading(true);
      setFileName(file.name);
      try {
        const text = await extractResumeText(file);
        onExtracted(text, file.name);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Could not read resume.");
        setFileName("");
      } finally {
        setReading(false);
      }
    },
    [onExtracted],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const valid = validateResumeFiles(files);
      if (valid.length === 0) return;
      if (valid.length === 1 || !onBulk) {
        void process(valid[0]);
        return;
      }
      onBulk(valid);
    },
    [onBulk, process],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) handleFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-10 text-center transition-colors",
        dragActive ? "border-accent bg-accent/10" : "border-white/10 bg-white/[0.02] hover:border-accent/50",
      )}
    >
      {reading || busy ? (
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      ) : fileName ? (
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      ) : (
        <Upload className="h-8 w-8 text-accent" />
      )}
      <div>
        <div className="text-base font-medium">
          {fileName ? (
            <>
              Loaded <span className="text-accent">{fileName}</span>
            </>
          ) : (
            "Drop one or many resumes to extract candidate data"
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          PDF or DOCX · up to 10 MB each · up to {BULK_LIMIT} files
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={reading || busy}
          className="rounded-xl border-white/10 bg-white/[0.03]"
        >
          <FileText className="h-4 w-4" /> Choose file
        </Button>
        {onBulk && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Files className="h-3.5 w-3.5" /> Select multiple for bulk mode
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) handleFiles(files);
        }}
      />
    </div>
  );
}