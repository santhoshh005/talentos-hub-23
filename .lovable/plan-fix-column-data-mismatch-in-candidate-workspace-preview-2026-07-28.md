# Fix column/data mismatch in Candidate Workspace preview

## What's happening

In the preview screenshot, the column labeled **Current CTC** shows the email, **Current Company** shows the phone, **Expected CTC** shows the company name, and **Remarks** shows "4 years". The extractor is filing data into the right record fields — the issue is that the template's columns pull from different fields than their labels suggest.

Each template column has two independent properties:

- `fieldKey` — which extracted field the column reads (e.g. `email`, `currentCompany`).
- `label` — the header text shown in preview/Excel.

Renaming a label does **not** change the source field. In the current UI these two live in one row of the template editor, and the rearranger in the preview only shows the label, so a mismatch is easy to create and impossible to spot from the preview alone.

## Fix (frontend/UX only, no extractor changes)

### 1. Show the source field next to the label everywhere

- **TemplateEditor row**: show the resolved field name (e.g. "reads: Email") beside the label input, and highlight the row in amber when the label clearly doesn't describe the field (heuristic: known-label keywords like "ctc", "company", "email", "mobile" not matching the fieldKey's family).
- **ExportPreview rearranger sidebar**: under each label input, show a small "from: <Field Group · Field Label>" caption and a compact field picker so the user can remap without leaving the preview.
- **BulkCandidateTable preview**: add the same "from: <field>" caption under each header cell.

### 2. Auto-suggest fieldKey when a label is typed

In TemplateEditor, when the user edits a label, run the existing `suggestFieldMapping` heuristic (from `src/lib/templates/excel-import.ts`) against the new label. If it returns a confident match and the current `fieldKey` is `__custom` or clearly unrelated, offer a one-click "Map to <field>" chip next to the row. Never auto-change the fieldKey silently.

### 3. Repair the seeded Template B and fix the demo

Confirm `src/lib/templates/seed-templates.ts` is correct (it is) and add a one-time migration in `local-template-repository.ts` that re-checks stored templates: for any column whose label strongly implies a different field than its current `fieldKey` (using the same heuristic), leave the data alone but set a `needsReview: true` flag so the editor can surface a banner: "Some columns may be reading the wrong field."

### 4. Preview parity check

Add a lightweight check inside `ExportPreview` and `BulkCandidateTable`: if any visible column's label suggests a field different from its `fieldKey`, show a single dismissible banner above the table: "N column(s) may be pulling from an unexpected field — open the rearranger to remap." Clicking the banner scrolls to the first flagged row.

## Technical details

Files to touch:

- `src/components/workspace/templates/TemplateEditor.tsx` — resolved-field caption, mismatch highlight, "Map to <field>" chip.
- `src/components/workspace/candidate/ExportPreview.tsx` — per-row field caption + inline field picker, mismatch banner.
- `src/components/workspace/candidate/BulkCandidateTable.tsx` — per-header field caption, mismatch banner.
- `src/lib/templates/local-template-repository.ts` — one-time `needsReview` migration on load.
- `src/lib/templates/template-types.ts` — add optional `needsReview?: boolean` on `ClientTemplate`.
- `src/lib/templates/excel-import.ts` — export the label→fieldKey heuristic as a reusable `suggestFieldKeyForLabel(label)` helper so editor, preview, and migration all use one implementation.

Non-goals:

- No changes to the LLM extractor or `candidate-parse.ts`.
- No changes to the export code path (`candidate-export.ts`); the fix is entirely in how columns are configured and surfaced.
