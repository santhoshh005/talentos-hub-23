import { useState } from "react";
import { ArrowLeft, Upload, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CANDIDATE_FIELDS } from "@/lib/candidate-schemas";
import { parseTemplateHeaders, suggestFieldMapping } from "@/lib/templates/excel-import";
import { localTemplateRepository } from "@/lib/templates/local-template-repository";
import type { TemplateColumn } from "@/lib/templates/template-types";

export function ExcelImportPanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [columns, setColumns] = useState<TemplateColumn[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [busy, setBusy] = useState(false);

  const options = [
    ...CANDIDATE_FIELDS.map((f) => ({ value: f.key, label: `${f.group} · ${f.label}` })),
    { value: "__custom", label: "Custom column (no field)" },
  ];

  const onPick = async (file: File) => {
    setBusy(true);
    try {
      const headers = await parseTemplateHeaders(file);
      if (headers.length === 0) {
        toast.error("No headers found in the first row.");
        return;
      }
      setFileName(file.name);
      setTemplateName(file.name.replace(/\.[^.]+$/, ""));
      setColumns(suggestFieldMapping(headers));
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      toast.error(
        /upload an \.xlsx|under 5 MB/.test(message) ? message : "Could not read Excel file.",
      );
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (columns.length === 0) {
      toast.error("Import a file first.");
      return;
    }
    // Replace unmapped custom keys with __custom for export safety.
    const cleaned = columns.map((c) => ({
      ...c,
      fieldKey: c.fieldKey.startsWith("__unmapped") ? "__custom" : c.fieldKey,
    }));
    localTemplateRepository.create({
      name: templateName.trim() || "Imported template",
      description: `Imported from ${fileName}`,
      columns: cleaned,
      export: { sheetName: "Candidates" },
    });
    toast.success("Template created from Excel");
    onCreated();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </button>
        <Button
          type="button"
          onClick={save}
          disabled={columns.length === 0}
          className="rounded-lg bg-gradient-to-r from-primary to-accent shadow-2xl shadow-primary/30"
        >
          <Save className="h-4 w-4" /> Save as template
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold tracking-tight">Import an existing client Excel</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the client's tracker (e.g. <em>CGI_Tracker.xlsx</em>). We read the header row and
          let you map each column to a candidate field. Save it once — reuse it forever.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
            <Upload className="h-4 w-4 text-accent" />
            {fileName || "Choose .xlsx"}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void onPick(f);
              }}
            />
          </label>
          {busy && <span className="text-xs text-muted-foreground">Reading…</span>}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" /> Auto-mapping coming soon
          </span>
        </div>
      </div>

      {columns.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Template name
              </span>
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Column mapping
            </div>
            {columns.map((c, i) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2"
              >
                <div className="w-64 truncate rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5 text-xs">
                  <span className="text-muted-foreground">Header:</span>{" "}
                  <span className="font-medium">{c.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
                <select
                  value={
                    c.fieldKey.startsWith("__unmapped")
                      ? "__custom"
                      : options.find((o) => o.value === c.fieldKey)
                        ? c.fieldKey
                        : "__custom"
                  }
                  onChange={(e) =>
                    setColumns((cs) =>
                      cs.map((col, idx) =>
                        idx === i ? { ...col, fieldKey: e.target.value } : col,
                      ),
                    )
                  }
                  className="min-w-[220px] rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs outline-none focus:border-accent"
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-background">
                      {o.label}
                    </option>
                  ))}
                </select>
                {c.fieldKey.startsWith("__unmapped") && (
                  <span className="text-[10px] uppercase tracking-widest text-amber-300">
                    Unmapped
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
