
# TalentOS Pivot — Recruiter Workspace + Candidate Workspace

Product evolution, not a rewrite. Turn `/ai-lab` into `/workspace` (Recruiter Workspace), promote a new **Candidate Workspace** flow to flagship, and keep the existing Resume Intelligence pipeline intact under `/workspace/intelligence`.

## 1. Routes & Navigation

New route files (each with own `head()` metadata + JSON-LD-free minimal SEO):
- `src/routes/workspace.tsx` — layout route, renders header + sub-nav + `<Outlet />`. Default redirects to `/workspace/candidate`.
- `src/routes/workspace.index.tsx` — redirects to `/workspace/candidate` via `beforeLoad` throwing `redirect({ to: "/workspace/candidate" })`.
- `src/routes/workspace.candidate.tsx` — Candidate Workspace (primary).
- `src/routes/workspace.intelligence.tsx` — hosts existing `ResumeAnalyzerModal` flow inline (no modal-only entry).
- `src/routes/workspace.jd.tsx`, `workspace.boolean.tsx`, `workspace.interview.tsx` — "Coming soon" placeholders reusing existing tab visuals.
- `src/routes/workspace.templates.tsx` — Client Templates manager.
- `src/routes/ai-lab.tsx` — replaced with a redirect stub (`beforeLoad → redirect("/workspace")`) so old links keep working.

Nav updates in `Navbar.tsx`, `Footer.tsx`, homepage hero (`src/routes/index.tsx`), and any button copy: **AI Lab → Recruiter Workspace**. Metadata/titles/descriptions updated in each new route's `head()`.

Sub-navigation inside `/workspace` uses a glass tab strip that links between the six sub-routes, active state via `<Link activeProps>`.

## 2. Candidate Workspace flow

Directory `src/components/workspace/candidate/` with small composable pieces:

- `CandidateUpload.tsx` — drag & drop + browse (PDF/DOCX), single file. Reuses `extractResumeText` from `src/lib/resume-extract.ts`.
- `CandidateExtractionProgress.tsx` — animated stepper while extraction runs.
- `CandidateSnapshot.tsx` — post-extract summary card (name, headline designation, years, current company, top 4 skills) + "Continue Editing" button.
- `CandidateRecordEditor.tsx` — orchestrator that composes the sections below (no giant form).
- Section components (each ~<150 LOC):
  - `CandidateIdentity.tsx`
  - `CandidateContact.tsx`
  - `CandidateCurrentEmployment.tsx`
  - `CandidatePreviousEmployment.tsx` (array; add/remove/reorder/duplicate via dnd-kit)
  - `CandidateExperience.tsx`
  - `CandidateSkills.tsx` (primary + secondary chips; add/remove/reorder)
  - `CandidateEducation.tsx` (array)
  - `CandidateCertifications.tsx` (array)
  - `CandidateCompensation.tsx`
  - `CandidateDocuments.tsx` (PAN, Passport, Visa)
  - `CandidateNotes.tsx` — dedicated recruiter notes (multi-line, exported)
- `CandidateCompleteness.tsx` — computes % complete and lists missing key fields.
- `TemplateSelector.tsx` — pick from Recent / Favorites / All templates; link to Templates manager.
- `ExportPreview.tsx` — spreadsheet-style grid (glass table) built from `CandidateRecord × ClientTemplate`. Edit cells, add/remove/reorder columns, rename labels inline.
- `ExportActions.tsx` — Export `.xlsx` and `.csv`; filename `candidate-{lastName}-{templateSlug}-{yyyyMMdd}.{ext}`.

State lives in a `useCandidateRecord` hook (React state, no global store needed). Extraction/edit state resets per upload.

## 3. Candidate extraction (server)

- `src/lib/candidate-schemas.ts` — Zod `CandidateRecordSchema` covering every field in the brief; all optional/defaulted so missing values become `""` / `[]` and never crash.
- `src/lib/candidate-extract.server.ts` — thin wrapper around existing `ai-gateway.server.ts`, structured-output prompt returning `CandidateRecord`. Retry once, fall back to partial record.
- `src/lib/candidate-extract.functions.ts` — `extractCandidateRecord = createServerFn({ method: "POST" }).inputValidator(...).handler(...)`.
- Called from `CandidateWorkspace` via `useServerFn`.

Reuses text extraction (`resume-extract.ts`) and AI Gateway — no duplication of pipeline logic.

## 4. Client Templates (localStorage now, Cloud-ready)

Directory `src/lib/templates/`:

- `template-types.ts` — `ClientTemplate`, `TemplateColumn`, `ExportSettings`, `TemplateSummary`.
- `template-repository.ts` — `TemplateRepository` interface: `list`, `get`, `create`, `update`, `duplicate`, `delete`, `toggleFavorite`, `markRecent`, `listRecent`, `listFavorites`.
- `local-template-repository.ts` — `localStorage` implementation (`talentos:templates:v1`, `talentos:templates:recent:v1`). UI never touches localStorage directly.
- `seed-templates.ts` — Templates A / B / C seeded on first load if store empty.
- `use-templates.ts` — React hook exposing repo + reactive state (via `useSyncExternalStore`).
- Swapping to Cloud later = replace one file.

Templates manager UI (`/workspace/templates`):
- List with Recent, Favorites, All tabs.
- Create / Edit / Duplicate / Delete / Favorite.
- `TemplateEditor.tsx` — column list with dnd-kit drag-reorder, hide toggle, custom label, default value, per-template notes, export settings (sheet name).
- "Import from existing Excel" panel:
  - `src/lib/templates/excel-import.ts` — `parseTemplateHeaders(file)` reads row 1 via `xlsx`.
  - `suggestFieldMapping(headers)` — small keyword table for now; leaves unknown headers unmapped.
  - Recruiter manually confirms mapping → saves as new template.
  - Architecture ready for future LLM auto-mapping.

## 5. Export

- `src/lib/candidate-export.ts` — builds a single-row worksheet from `CandidateRecord` + `ClientTemplate`, respecting column order, custom labels, defaults, hidden columns. Notes column is included when present in template.
- Uses SheetJS (`xlsx`) for both `.xlsx` and `.csv`. Architected to accept `CandidateRecord[]` in future for bulk.

## 6. Resume Intelligence tab (unchanged)

- `src/routes/workspace.intelligence.tsx` mounts the existing analyzer flow — either lifts `ResumeAnalyzerModal` internals into an inline component or opens it automatically. Pipeline, scoring, evidence, `RecruiterReport`, PDF export stay exactly as-is; only container + labels change.
- No changes under `src/lib/pipeline.server.ts`, `scoring-engine.ts`, `evidence-engine.ts`, `recruiter-report-pdf.ts`.

## 7. Placeholder tabs

`/workspace/jd`, `/workspace/boolean`, `/workspace/interview` render a shared `ComingSoonPanel` (reuses existing hero styling + icons already defined in `AiLabWorkspace.tsx`).

## 8. Design

- Dark, glass, spreadsheet-inspired. Reuses existing tokens (`bg-white/[0.02]`, `border-white/10`, primary/accent gradient).
- Sub-nav = pill tabs w/ layoutId slide.
- Export preview = compact zebra-striped glass table.
- Fully responsive (stacked sections on mobile, two-column on ≥md, three-column on ≥xl).

## 9. Dependencies

Add:
- `xlsx` (SheetJS) — Excel/CSV read+write.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — column + array reordering.

## 10. Non-goals (architected, not built)

- Bulk resume upload (repository + schema accept arrays; UI stub only).
- Cloud template sync (repo swap).
- AI header auto-mapping (`suggestFieldMapping` hook point).
- Candidate history, ATS integration, shared team templates.

## Files summary

**Add**
- Routes: `workspace.tsx`, `workspace.index.tsx`, `workspace.candidate.tsx`, `workspace.intelligence.tsx`, `workspace.jd.tsx`, `workspace.boolean.tsx`, `workspace.interview.tsx`, `workspace.templates.tsx`.
- `src/components/workspace/` (WorkspaceLayout, SubNav, ComingSoonPanel) + `candidate/*` (all section + flow components) + `templates/*` (Manager, Editor, ExcelImport).
- `src/lib/candidate-schemas.ts`, `candidate-extract.server.ts`, `candidate-extract.functions.ts`, `candidate-export.ts`.
- `src/lib/templates/*` (types, repository, local impl, excel-import, seed, hook).

**Modify**
- `src/routes/ai-lab.tsx` → redirect stub.
- `src/routes/index.tsx` hero CTA copy.
- `src/components/layout/Navbar.tsx`, `Footer.tsx` — rename AI Lab → Recruiter Workspace, point to `/workspace`.
- `src/components/loader/*` copy references (if any).
- `README.md` positioning line.

**Untouched**
- `pipeline.server.ts`, `scoring-engine.ts`, `evidence-engine.ts`, `matching-engine.ts`, `semantic-match.server.ts`, `llm-extract.server.ts`, `recruiter-report-pdf.ts`, `resume-analyzer.*`, existing `RecruiterReport.tsx`. Composed, not rewritten.
