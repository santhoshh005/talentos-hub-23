# Unique Global Throbber for TalentOS

Build a signature, visually striking loader that becomes TalentOS's motion identity — and wire it into every place the app can wait: first visit, route changes, and every async operation (extraction, AI calls, export, template load).

## The throbber concept: "Neural Orbit"

A compact, self-contained mark, 56–72px, designed to feel alive rather than mechanical. Three synchronized layers:

1. Conic gradient ring — a rotating primary→accent→primary sweep with a soft blur glow (drop-shadow using primary/60). 1.6s linear loop.
2. Counter-rotating dashed inner ring — thin, low opacity, 2.4s reverse loop. Adds depth without noise.
3. Three orbiting dots on independent radii — primary, accent, white/70 — each on its own duration (1.2s / 1.8s / 2.6s) so the pattern never repeats exactly. Dots trail a faint motion blur.
4. Center glyph — TalentOS "T" mark, breathing scale (0.94 → 1.0) at 1.8s, subtle inner glow pulse.

The whole mark sits inside an optional glass chip (rounded-2xl, backdrop-blur-xl, border-white/10) when used as a page/overlay loader. When used inline (buttons, table rows) only the mark renders, sized down to 16–20px with the inner ring hidden.

Two size modes, one component:
- `sm` (16–24px) — inline, buttons, table cells
- `md` (56–72px) — cards, panels, overlays
- `xl` (120px+) — first-visit cinematic (reuses existing `TalentOSLoader` shell)

## Where it appears

### 1. First visit (already exists)
Keep `FirstVisitGate` + `TalentOSLoader` cinematic intro. Swap its central `LoaderLogo` for the new Neural Orbit at xl size so the intro visually matches every other loader.

### 2. Every route change
Add a top-of-viewport progress strip + a Neural Orbit chip in the corner while `router.state.status === "pending"`. Strip uses the same conic gradient, animates left→right, fades out on settle. Mounted once in `__root.tsx`.

### 3. Async operations
Replace all ad-hoc spinners (`Loader2`, shimmer-only skeletons where a spinner belongs, button spinners) with the new component:
- Candidate extraction (single + bulk row status)
- Bulk table row "parsing" / "extracting" states
- Export XLSX button while generating
- Template load / import
- Any `useServerFn` in-flight state

### 4. Suspense / lazy boundaries
A `<GlobalThrobber />` overlay wrapper for Suspense fallbacks and long lists.

## Technical details

### New files
- `src/components/loader/NeuralOrbit.tsx` — the mark itself. Props: `size?: "sm" | "md" | "xl"`, `label?: string`, `variant?: "bare" | "chip" | "overlay"`. Pure CSS/framer-motion, no external assets.
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

### Router wiring
```ts
const status = useRouterState({ select: (s) => s.status });
// "pending" → show strip + chip, "idle" → fade out (200ms)
```

## Out of scope
- No changes to the extraction pipeline, template logic, or exports beyond swapping spinner visuals.
- No new sound or haptics.
- No third-party animation libraries (framer-motion is already installed).
