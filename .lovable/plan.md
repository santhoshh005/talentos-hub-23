## Plan — Make `/report` the natural continuation of the Resume Analyzer

Goal: the modal only collects inputs and shows loading/error. On pipeline success, auto-navigate to `/report`, which renders the existing `RecruiterReport` from the passed `PipelineResult`. No new nav item. No duplicated report UI. No backend changes.

### 1. Add a tiny shared store for the last PipelineResult

New file: `src/lib/report-store.ts`

- Module-level singleton with `getResult()`, `setResult(result)`, `clearResult()`, and a `subscribe(fn)` for React via `useSyncExternalStore`.
- Also mirror to `sessionStorage` under `talentos:last-report` so a refresh on `/report` keeps the report visible.
- Export `useLastReport()` hook returning `PipelineResult | null`.

Why not router state or URL search: `PipelineResult` is large/nested; putting it in URL or history state is fragile. A module store + sessionStorage is the smallest, safest handoff.

### 2. Rewire `ResumeAnalyzerModal` to run the pipeline and navigate

Edit `src/components/ai-lab/ResumeAnalyzerModal.tsx`:

- Replace the two-call flow (`parseResume` + `analyzeResumeMatch`) with a single call to `runResumeIntelligence` from `@/lib/pipeline.functions` via `useServerFn`.
- Keep the existing intake UI: resume upload (drag/drop + browse) and JD (paste/upload) — unchanged visually.
- Keep the existing "Analyzing" overlay with the illuminated LOADING steps, driven by the same `activeStep` timer pattern used in `src/routes/report.tsx` (Resume Uploaded → Parsing → JD Intelligence → Normalizing → Matching → Evidence → Preparing Report).
- On success:
  1. `setResult(pipelineResult)` in the shared store.
  2. Show a brief "Report ready" state (~350 ms so the last step visibly illuminates).
  3. `onClose()` the modal, then `navigate({ to: "/report" })`.
- On failure: stay in the modal, show error message + failed stage + Retry (reruns pipeline with same inputs) and Start Over (clears inputs). Do not navigate.
- Remove the modal's post-analysis result view (analysis card, copy/share/PDF buttons wired to the old `analysis` object) and the `analysis`/`analyzeResumeMatch` state. The modal is now inputs + loading + error only.
- Preserve the modal's existing styling, sizing, and animation — only the "result" branch is deleted and replaced with the auto-close/navigate handoff.

### 3. Convert `/report` into a display-only screen that reads the store

Edit `src/routes/report.tsx`:

- Remove the intake form, the in-page pipeline call, and the `LoadingSteps` UI (the modal now owns intake + loading).
- On mount, read `useLastReport()`:
  - If a `PipelineResult` exists → render `<RecruiterReport data={result} />` plus the existing "New Report" button that calls `clearResult()` and `navigate({ to: "/ai-lab" })`.
  - If none exists (user hit `/report` directly with no prior run) → render a small empty state card: "No report yet — start from the AI Lab" with a button that navigates to `/ai-lab`. This is a passive fallback, not a nav item, and avoids a blank page.
- Keep the existing `head()` metadata unchanged.

### 4. Files touched

- Add: `src/lib/report-store.ts`
- Edit: `src/components/ai-lab/ResumeAnalyzerModal.tsx` (swap analyzer calls → pipeline; delete result view; add navigate-on-success)
- Edit: `src/routes/report.tsx` (drop intake + loading; read store; render `RecruiterReport` or empty state)

### 5. Not touching

- `src/components/report/RecruiterReport.tsx` — reused as-is.
- `src/lib/pipeline.server.ts`, `pipeline.functions.ts`, and all engines (parser, JD intelligence, normalization, matching, evidence) — untouched.
- `Navbar.tsx` — no new nav item.
- Home / Dashboard / other routes — untouched.

### 6. Verification after implementation

- Open `/ai-lab` → launch modal → upload resume → paste JD → click **Analyze Resume**.
- Confirm modal shows illuminated loading steps only (no report inside modal).
- On success, modal closes and app lands on `/report` with `RecruiterReport` fully populated (header, skill chips, evidence, pipeline stages).
- On simulated failure (empty/garbage JD triggering pipeline error), modal stays open with error + Retry.
- Refresh `/report` — report still visible (sessionStorage rehydration).
- Visit `/report` fresh in a new session — empty-state card appears, not a broken page.

Approve to switch to build mode and apply the three-file change above.