import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { extractResumeText } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";

export function CandidateUpload({
  onExtracted,
  busy,
}: {
  onExtracted: (text: string, fileName: string) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const process = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
        toast.error("Upload a PDF or DOCX resume.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Resume must be under 10 MB.");
        return;
      }
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

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void process(f);
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
            "Drop a resume to extract candidate data"
          )}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">PDF or DOCX · up to 10 MB · single file</div>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={reading || busy}
        className="rounded-xl border-white/10 bg-white/[0.03]"
      >
        <FileText className="h-4 w-4" /> Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void process(f);
        }}
      />
    </div>
  );
}