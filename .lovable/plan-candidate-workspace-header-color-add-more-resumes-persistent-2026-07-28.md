# Candidate Workspace: header color, add-more resumes, persistent bulk state

Three focused changes to the Candidate Workspace.

## 1. Header background color — preview only

Move the header color control out of the template editor flow and into the preview surface itself.

- Add a small "Header color" swatch + native color input in the top bar of both `ExportPreview` (single) and `BulkCandidateTable` (bulk).
- Only the background color is user-controlled here. Text color stays at the template default (auto-contrast stays out of scope).
- The chosen color drives the preview `thead` background and the exported `.xlsx` header fill for that export session.
- Scope: session-only override, not persisted to the template. Default value seeds from `template.headerColor ?? DEFAULT_HEADER_COLOR`.
- The existing Template Editor color controls remain (they set the default), but the preview no longer requires opening the editor to tweak a color for one export.

## 2. "Add more resumes" to the current batch

After a single resume is parsed (snapshot/edit phase) or after a bulk run finishes, let the recruiter append more resumes to the same working set instead of starting over.

- Add an "Add more resumes" button (with the same drop/pick affordance) in:
  - `CandidateSnapshot` / edit view — clicking it promotes the current single record into a bulk batch (as row 1) and opens the file picker for additional resumes.
  - `BulkCandidateTable` header — appends new files to the existing `bulkItems` list and runs them through the same concurrency queue.
- New files reuse the existing parse + extract pipeline and stream into the same table with Queued → Parsing → Extracting → Ready states.
- "Start over" still clears everything.

## 3. Persist bulk state across workspace navigation

Right now navigating to `/workspace/templates` and back remounts `CandidateWorkspace`, wiping `bulkItems`, `record`, and `phase`.

- Persist workspace state (phase, single record, bulk items, selected template id) to `sessionStorage` under `talentos:candidate-workspace:v1`.
- Rehydrate on mount; if a bulk batch or a parsed record exists, restore that phase instead of dropping the recruiter back to the upload screen.
- Only serializable fields are stored — in-flight `parsing`/`extracting` items are re-marked as `failed` with a "Re-upload to retry" note on rehydrate (files themselves can't be persisted), so completed rows survive but incomplete ones surface clearly.
- "Start over" clears the persisted entry.

## Technical notes

Files to touch:
- `src/components/workspace/candidate/ExportPreview.tsx` — inline header color control; pass override into export call.
- `src/components/workspace/candidate/BulkCandidateTable.tsx` — inline header color control; "Add more resumes" button; pass override into `exportBulkXlsx`.
- `src/components/workspace/candidate/CandidateSnapshot.tsx` (and/or edit view in `CandidateWorkspace`) — "Add more resumes" affordance that promotes single → bulk.
- `src/components/workspace/candidate/CandidateUpload.tsx` — small reusable "append files" trigger (button variant of the existing dropzone).
- `src/components/workspace/candidate/CandidateWorkspace.tsx` — sessionStorage persistence hook, promotion logic (single record → first bulk item), append-to-batch handler that reuses the existing concurrency runner.
- `src/lib/candidate-export.ts` — accept an optional `headerColorOverride` on both single and bulk export paths.

Non-goals: no changes to extraction logic, template schema, or routing.