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

Add `src/lib/candidate-parse.ts` — pure browser-safe regex parser that pulls fields directly from resume text:
- Email: RFC-ish regex
- Mobile: intl + Indian formats, strip separators
- LinkedIn / GitHub / Portfolio: URL sniff by host
- Full name: first non-empty line heuristic (title case, ≤4 words, no digits/@)
- Current company + designation: scan "Experience" section, first entry with "Present/Current"
- Previous employment: date-range block splitter
- Total experience: "X years" / "X.Y yrs" pattern, else compute from earliest date
- Education: degree keywords (B.E, B.Tech, MBA, M.Sc…) + institution line
- Certifications: bullet lines under "Certifications" heading
- Skills: comma/pipe split under "Skills / Technical Skills / Tools" heading (sanitized via existing `token-sanitizer`)
- CTC, Notice period, Location: labeled-line regex ("Notice Period:", "CTC:", "Location:")
- PAN / Passport: format regex

Update `runExtractCandidate` in `src/lib/candidate-extract.server.ts` to accept an optional `deterministicSeed: Partial<CandidateRecord>` and **merge with LLM output field-by-field** (LLM wins only when non-empty; deterministic fills blanks). Also strengthen prompt to instruct verbatim copy for contact/company/CTC.

In `CandidateWorkspace.onExtracted`, run `parseCandidateText(resumeText)` first, pass seed to server fn, and use it as an immediate optimistic record so the snapshot never appears empty even if the LLM returns blanks.

### 2. NA fallback for missing values

Add `src/lib/candidate-display.ts` with `display(value) => value?.trim() || "NA"`. Update `CandidateSnapshot.tsx`, `CandidateCompleteness.tsx`, and `ExportPreview.tsx` to render "NA" for empty scalar fields (arrays render as "NA" chip when empty). Export logic still writes `""` unless the template's default value is set — recruiter-visible "NA" only in UI/preview.

### 3. Skeletons while extracting

- Replace the current `CandidateExtractionProgress` overlay with a two-column skeleton mock of the eventual editor + snapshot using existing `Shimmer`/`Skeletons.tsx` primitives (new `CandidateWorkspaceSkeleton.tsx`).
- Show it during `phase === "extracting"` so recruiters see the shape of the workspace immediately.
- Add lightweight skeleton for `ExportPreview` while template/record settle.

### 4. Excel preview after extraction + column rearrangement

- Move `ExportPreview` into `phase === "snapshot"` as well as `edit`, so it appears the moment extraction completes (below the snapshot card).
- Add a **Column Order** panel inside `ExportPreview` (or new `ExportColumnRearranger.tsx`) using `@dnd-kit/sortable` (already installed):
  - Lists the currently visible template columns (Name, Phone, Email, …)
  - Drag handles to reorder
  - Toggle visibility per column
  - "Reset to template" button
  - Order is local to this export (does not mutate the saved template) — held in `CandidateWorkspace` state as `columnOverride: string[] | null`
- `ExportPreview` and the xlsx/csv exporter both consume the override when present.

### 5. Small correctness fixes

- `CandidateUpload` calls `onExtracted(text, file.name)`; `CandidateWorkspace` currently ignores fileName. Thread it through so export filename can use candidate last name **or** fall back to uploaded filename stem.
- Guard `extractCandidateRecord` handler: if resumeText < 20 chars, return deterministic seed directly (skip LLM) to avoid the current Zod min-length crash surface.

### Files

**Add**
- `src/lib/candidate-parse.ts`
- `src/lib/candidate-display.ts`
- `src/components/workspace/candidate/CandidateWorkspaceSkeleton.tsx`
- `src/components/workspace/candidate/ExportColumnRearranger.tsx`

**Modify**
- `src/lib/candidate-extract.server.ts` (seed merge + stronger prompt)
- `src/lib/candidate-extract.functions.ts` (accept optional seed)
- `src/lib/candidate-export.ts` (respect columnOverride)
- `src/components/workspace/candidate/CandidateWorkspace.tsx` (seed, phase wiring, skeleton, preview in snapshot, column override state)
- `src/components/workspace/candidate/CandidateSnapshot.tsx` (NA)
- `src/components/workspace/candidate/CandidateCompleteness.tsx` (NA)
- `src/components/workspace/candidate/ExportPreview.tsx` (NA, columnOverride, rearranger)

**Untouched:** Resume Intelligence pipeline, templates repository, all other routes.
