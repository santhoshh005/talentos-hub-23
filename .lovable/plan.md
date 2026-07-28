## Candidate Workspace — Extraction, Skeletons, NA, Rearrange

Four scoped fixes. No changes to Resume Intelligence pipeline.

### 1. Deterministic parser + LLM merge (fixes "not extracting")

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
