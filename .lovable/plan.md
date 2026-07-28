# Unique Global Throbber for TalentOS

Build a signature loader that becomes TalentOS's motion identity — the way Linear's progress bar or Raycast's command palette instantly identifies those products. One Neural Orbit component, reused everywhere, only the center icon and message change with context.

## Motion principles (non-negotiable)

- Never a continuous mechanical spin. The orbit **breathes**: accelerates in, holds a beat, eases, briefly pauses, resumes. Rotation speed modulates on a 2.4s cycle so it never feels metronomic.
- Motion is subtle over flashy — soft glow modulation, gentle scale breathing, low-opacity trails. No strobing, no rainbow, no bounce.
- Feels like the product is *thinking about recruiter data*, not waiting on a network.
- Respect `prefers-reduced-motion`: freeze rotation, keep only the breathing glow and message rotation.

### Completion choreography
When the tracked operation resolves, the loader plays a scripted exit (total ~700ms):
1. Glow bloom — primary shadow intensity ramps up (120ms)
2. Scale down to 0.85 with ease-out (140ms)
3. Success check draws in (SVG stroke-dasharray reveal, 220ms) inside the ring
4. Hold (80ms), then fade opacity → 0 and scale → 0.9 (200ms)

Exposed as `<NeuralOrbit state="loading" | "success" | "error" />`; parents flip state on resolve/reject and the component owns the animation.

### Contextual loading messages
Message text lives beside the orbit and cross-fades every ~1.6s through a context-specific rotation. Never generic "Loading…".

Message sets by context (defined in `src/lib/loader-messages.ts`):
- `resume-extract`: "Reading resume…", "Extracting candidate profile…", "Finding skills…", "Organizing candidate data…", "Almost ready…"
- `bulk-extract`: "Reading resumes…", "Extracting profiles in parallel…", "Normalizing skills…", "Assembling batch…"
- `templates`: "Loading client templates…", "Restoring your mappings…"
- `export`: "Preparing spreadsheet…", "Applying template styling…", "Generating Excel…", "Almost ready…"
- `route`: "Loading…" (single, subtle — route transitions are quick)
- `first-visit`: existing cinematic script stays, wired through this rotator

Consumers pass `context="resume-extract"` (or a custom `messages={[…]}` array). Component owns the cross-fade.

## The throbber concept: "Neural Orbit"

A compact, self-contained mark designed to feel alive. Four synchronized layers, all obeying the breathing cycle above:

1. Conic gradient ring — primary→accent→primary sweep with primary/60 drop-shadow. Non-linear timing (cubic-bezier with a hold segment) instead of `linear infinite`.
2. Counter-rotating dashed inner ring — thin, low opacity, reverse direction, offset phase.
3. Three orbiting dots on independent radii and durations (1.2s / 1.8s / 2.6s) — pattern never repeats exactly, faint motion blur trail.
4. Center icon — swappable per context (Lucide icon or TalentOS "T"), breathing scale 0.94 → 1.0, subtle inner glow pulse synced to the ring.

Center icon by context: `FileText` (resume-extract), `Users` (bulk), `LayoutTemplate` (templates), `FileSpreadsheet` (export), TalentOS "T" (first-visit / route / default).

The mark sits inside an optional glass chip (rounded-2xl, backdrop-blur-xl, border-white/10) for panel/overlay use. Inline usage renders only the mark with the inner ring hidden.

Size modes:
- `sm` (16–24px) — inline, buttons, table cells
- `md` (56–72px) — cards, panels, overlays
- `xl` (120px+) — first-visit cinematic (reuses existing `TalentOSLoader` shell)

## Where it appears

### 1. First visit (already exists)
Keep `FirstVisitGate` + `TalentOSLoader` cinematic intro. Swap its central `LoaderLogo` for the new Neural Orbit at xl size so the intro visually matches every other loader.

### 2. Every route change
Add a top-of-viewport progress strip + a Neural Orbit chip in the corner while `router.state.status === "pending"`. Strip uses the same conic gradient, animates left→right, fades out on settle. Mounted once in `__root.tsx`.

### 3. Async operations
Replace ad-hoc spinners (`Loader2`, button spinners) with the new component, each with its own `context`:
- Candidate extraction — `context="resume-extract"`
- Bulk table rows — `context="bulk-extract"` on overlay, `<InlineSpinner />` per row
- Export XLSX button — `context="export"`
- Template load / import — `context="templates"`
- Any other `useServerFn` in flight — falls back to a generic message

Each of these flips `state` to `"success"` on resolve so the completion choreography plays before the loader unmounts.

### 4. Suspense / lazy boundaries
A `<GlobalThrobber />` overlay wrapper for Suspense fallbacks and long lists.

## Technical details

### New files
- `src/components/loader/NeuralOrbit.tsx` — the mark. Props: `size`, `variant` (`bare` | `chip` | `overlay`), `state` (`loading` | `success` | `error`), `context`, `messages?`, `icon?`, `onExitComplete?`. Framer-motion driven, no external assets.
- `src/lib/loader-messages.ts` — context → message list + icon map.
- `src/components/loader/MessageRotator.tsx` — cross-fades through the message list (reuses concept from existing `LoadingMessageRotator`).
- `src/components/loader/SuccessCheck.tsx` — animated check-draw SVG used by the completion sequence.
- `src/components/loader/RouteProgress.tsx` — top strip + corner chip driven by `useRouterState({ select: s => s.status })`. Mounted in `__root.tsx`.
- `src/components/loader/InlineSpinner.tsx` — thin re-export of `<NeuralOrbit size="sm" variant="bare" />` for ergonomic use in buttons.

### Files to update
- `src/routes/__root.tsx` — mount `<RouteProgress />`.
- `src/components/loader/TalentOSLoader.tsx` — replace `<LoaderLogo />` usage with `<NeuralOrbit size="xl" />` (keep everything else).
- `src/components/loader/LoaderProvider.tsx` — expose a `withLoader(promise)` helper that shows the overlay for arbitrary async work.
- `src/components/workspace/candidate/CandidateWorkspace.tsx` — use `<NeuralOrbit variant="overlay" />` during `extracting` phase alongside skeleton.
- `src/components/workspace/candidate/BulkCandidateTable.tsx` — swap status icon for `<InlineSpinner />` on parsing/extracting rows; show overlay orbit while export runs.
- `src/components/workspace/candidate/ExportPreview.tsx` — spinner in the Export button while generating.
- Grep for `Loader2` and `animate-spin` usages and replace where the intent is "we are waiting".

### Styling / tokens
- Add CSS keyframes in `src/styles.css`: `orbit-spin`, `orbit-reverse`, `orbit-breathe`, `orbit-dot-a/b/c` (varying durations + easings).
- Use existing tokens: `--primary`, `--accent`, `--foreground`. No hardcoded hex.
- Respect `prefers-reduced-motion`: freeze rotations, keep only the breathing glyph.

### Async wiring pattern
```tsx
const [state, setState] = useState<"idle"|"loading"|"success">("idle");
// on start: setState("loading")
// on resolve: setState("success"); NeuralOrbit calls onExitComplete → setState("idle")
<NeuralOrbit context="resume-extract" state={state} onExitComplete={() => setState("idle")} />
```

### Router wiring
```ts
const status = useRouterState({ select: (s) => s.status });
// "pending" → show strip + chip, "idle" → fade out (200ms)
```

## Out of scope
- No changes to the extraction pipeline, template logic, or exports beyond swapping spinner visuals.
- No new sound or haptics.
- No third-party animation libraries (framer-motion is already installed).
