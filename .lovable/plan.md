# Premium Branded Loading Experience

Replace all generic spinners with a cinematic, branded loading system that makes TalentOS feel like an operating system, plus page transitions and premium skeletons.

## New components (`src/components/loader/`)

- `TalentOSLoader.tsx` — full-screen loader. Composes background, logo, rotator, workflow, progress. Props: `progress?: number` (0–100, auto-animates if omitted), `variant: "cinematic" | "inline"`, `onDone?: () => void`, `minDurationMs?: number`.
- `LoaderBackground.tsx` — `#020617` base, animated blue/cyan gradient blobs, blurred futuristic grid mask, soft mouse-follow glow, ~20 floating particles, slow-drifting ghost cards (Resume / JD / Candidate / Offer / LinkedIn / Boolean Search / Interview) with heavy blur + low opacity. Reuses aesthetic tokens from `HeroBackground` so it feels native to the app.
- `LoaderLogo.tsx` — centered TalentOS wordmark: fade-in + scale 0.8→1, soft blue radial glow, 2s pulse loop. Below it, `Building the Future of AI Recruitment` with a typing effect (per-character reveal via framer-motion, not JS setInterval).
- `LoadingMessageRotator.tsx` — cycles the 11 provided messages every 2s with fade+slide (AnimatePresence). Guarantees no consecutive repeat by picking next index from remaining pool.
- `RecruitmentWorkflow.tsx` — 6 steps (Resume → AI Analysis → Shortlisting → Interview → Offer → Hired) with icons. Active step glows blue (ring + shadow), completed steps turn green with check, upcoming steps muted. Driven by `progress` (each step = 100/6).
- `LoaderProgress.tsx` — glowing horizontal blue line with animated width and percentage counter (spring-eased). If no explicit progress passed, uses an internal easing curve toward 100.
- `QuoteFlash.tsx` — 5% chance per mount, fades in one of 4 motivational quotes near the bottom.
- `SoundController.ts` — no-op stub exporting `playLoaderSound()` / `enableSound()`, wired but muted; leaves architecture for later.

All components respect `prefers-reduced-motion`: fall back to static logo + progress, no particles/blobs/typing.

## Global integration

- `src/components/loader/LoaderProvider.tsx` — context + `useLoader()` hook exposing `show()`, `hide()`, `setProgress()`. Renders `<TalentOSLoader variant="cinematic" />` as a fixed overlay with AnimatePresence exit fade.
- `src/components/loader/FirstVisitGate.tsx` — on mount, checks `localStorage["talentos.visited"]`. First visit: show cinematic loader ~3.5s then set flag and fade out. Return visits: skip (or render a ~400ms micro version).
- Mount `LoaderProvider` + `FirstVisitGate` inside `RootComponent` in `src/routes/__root.tsx`, above `<Outlet />`.

## Page transitions

- `src/components/layout/PageTransition.tsx` — wraps children in `motion.div` with fade+slide-up (y:12→0), 0.4s, cubic-bezier `[0.22,1,0.36,1]`. Keyed by `useRouterState({select: s => s.location.pathname})` inside `AnimatePresence mode="wait"`.
- Insert inside `AppLayout` around `{children}` so every route benefits without touching route files.

## Skeletons (`src/components/skeletons/`)

Premium shimmer skeletons (Tailwind + framer-motion, using `bg-white/[0.04]` shimmer via animated gradient). All use existing glass tokens.

- `KpiCardSkeleton.tsx`, `ChartSkeleton.tsx`, `TableRowSkeleton.tsx` → used by `DashboardSection` while data mounts (brief 500ms mount delay for perceived polish, respects reduced motion).
- `AiLabCardSkeleton.tsx` → `AiLabCards`.
- `UploadBoxSkeleton.tsx` → shown inside `ResumeAnalyzerModal` while pdf.js/mammoth chunks load.
- `BlogCardSkeleton.tsx` → `ContentLibrary` / `RecruitmentInsights`.
- `TimelineMilestoneSkeleton.tsx` → `CareerTimeline`.
- `CertificateCardSkeleton.tsx` → `CertificationsGrid`.

Each section conditionally renders its skeleton for a short mount window (or while an actual async op is in flight), then swaps to real content with a fade.

## Replacing existing spinners

Audit and replace every ad-hoc spinner (`Loader2`, plain "Loading…", the analyzer overlay) with either the branded inline mini loader (`<TalentOSLoader variant="inline" />`) or the appropriate skeleton. Analyzer keeps its progress bar but restyled to `LoaderProgress` styling for consistency.

## Out of scope

No changes to routing, data fetching, backend/server functions, or the underlying design tokens. No sound files shipped. No copy changes outside the loader itself.

## Technical notes

- Uses only existing deps (framer-motion, lucide-react, tailwind, shadcn). No new packages.
- All colors via semantic tokens (`--primary`, `--accent`, `--background`) — no hardcoded hex outside the already-approved `#020617` base already living in `styles.css`.
- Animations use transform/opacity only for 60fps; blurred blobs limited in count.
- `localStorage` access guarded for SSR (checked in `useEffect`).
- New files only; existing files edited: `src/routes/__root.tsx` (mount provider + gate), `src/components/layout/AppLayout.tsx` (wrap with `PageTransition`), and the six section components listed above (conditional skeleton render).
