# Bulk resume upload + template header color

Two additions to the Candidate Workspace and Templates area.

## 1. Bulk resume upload

Upgrade the upload surface on `/workspace/candidate` so recruiters can drop 1–many resumes and export them together as a single Excel using the selected client template.

Flow:
```text
Drop N resumes -> parse + extract each in parallel (concurrency 3)
  -> per-file progress list (Queued / Parsing / Extracting / Done / Failed)
  -> Bulk results table (editable rows, NA for failures)
  -> Single "Export .xlsx" using active template (one row per candidate)
```

Behavior:
- Accept multi-file drop / picker (PDF + DOCX), cap 25 files, 10 MB each.
- Each file runs the existing `extractResumeText` + `extractCandidateRecord` pipeline; failures render as an NA row that recruiter can still edit/export.
- New "Bulk mode" view replaces the single snapshot when >1 file is dropped: progress list on top, then a spreadsheet-style multi-row preview reusing template column order / hide controls.
- Single Export button emits one .xlsx with all rows; header row uses the template's header color (see #2).
- Single-file flow stays exactly as it is today.
- "Start over" clears the batch.

## 2. Header color picker for templates

Let users pick any color for the exported Excel header row per template.

- Add `headerColor?: string` (hex) and `headerTextColor?: string` to `ClientTemplate` (defaults: `#0F172A` bg / `#FFFFFF` text).
- Template editor gets a "Header style" section with a native color input + hex field for background and text, plus a live preview chip.
- `ExportPreview` preview table header uses the chosen color so recruiters see it before export.
- `candidate-export.ts` applies the color as the header row fill + font color when writing the xlsx (via SheetJS cell styles; introduce `xlsx-js-style` if the current lib does not support styles).

## Technical notes

Files to touch:
- `src/components/workspace/candidate/CandidateUpload.tsx` — allow `multiple`, emit `File[]`.
- `src/components/workspace/candidate/CandidateWorkspace.tsx` — add `bulk` phase, queue state, concurrency runner.
- New `src/components/workspace/candidate/BulkCandidateTable.tsx` — progress + editable multi-row preview + export.
- `src/lib/candidate-export.ts` — add `exportBulkXlsx(records, template)` and apply header color/text color styles.
- `src/lib/templates/template-types.ts` — add `headerColor`, `headerTextColor`.
- `src/lib/templates/seed-templates.ts` — sensible defaults on seeded templates.
- `src/components/workspace/templates/TemplateEditor.tsx` — header color controls.
- `src/components/workspace/candidate/ExportPreview.tsx` — render preview header with template color.

Single-file path stays identical; bulk mode only activates when the drop contains more than one file.
