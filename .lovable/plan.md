# Timeline Cards: Polished, Branded, Clickable

Redesign the timeline cards so the company logos read as clean, premium brand marks (not faded backgrounds), keep excellent text clarity, and link each card to its company site. Adds an AI-generated brand mark for the TalentOS "Future" card.

## Asset setup

Register company logos as Lovable Assets:
- `user-uploads://image-10.png` → `src/assets/companies/rubixe.png.asset.json`
- `user-uploads://image-11.png` → `src/assets/companies/xevyte.png.asset.json`
- `user-uploads://logo-1.svg` → `src/assets/companies/hardwin.svg.asset.json`

Generate a TalentOS brand image via `imagegen--generate_image` (premium, transparent PNG) → `src/assets/companies/talentos-ai.png`:
- Futuristic minimal emblem for an AI recruitment platform: glowing neural-network node subtly forming a "T", deep navy → electric blue → cyan gradient, soft glow, Apple/Linear aesthetic, on a clean background.

## Data changes (`src/components/timeline/CareerTimeline.tsx`)

Extend `TimelineItem` with `logo?: string` and `href?: string`.

1. **Rubixe – Data Analyst Intern** — logo: rubixe, href: `https://rubixe.com/`
2. **Xevyte – Technical Recruiter** — logo: xevyte, href: `https://xevyte.com/`
3. **Hardwin** — role → **"Talent Acquisition Specialist"**, logo: hardwin, href: `https://www.hardwinsoftware.com/`
4. **Future – TalentOS – Building AI Recruitment Products** — logo: talentos-ai (no href). Swap icon `Rocket` → `Sparkles`.

## Polished card design (clarity-first)

Restructure the card into two clear zones so logos are clearly visible and text stays crisp — no washed-out background logos.

**Logo header strip (top of card):**
- Height ~96px, full card width, rounded-top corners.
- Background: soft brand-tinted panel using the item's accent color (e.g. `bg-white/[0.04]` with a subtle radial gradient in `item.color` at ~15% opacity) — provides contrast for both light and dark logos.
- Centered `<img>` of the company logo, `object-contain`, `max-h-14`, full opacity, with a very light drop shadow for lift.
- Thin bottom divider (`border-white/[0.06]`) separating header from content.
- The small circular icon chip is removed for cards that have a `logo` (the logo replaces it); kept as-is for the TalentOS card in addition to the AI emblem to preserve rhythm — actually, for TalentOS use the AI emblem in the header strip too and drop the chip for consistency.

**Content zone (below strip):**
- Existing period pill, role, company name, description — unchanged typography and spacing so readability stays high.
- Add small `ExternalLink` lucide icon next to the role on linked cards only.

**Card container:**
- Keep glassmorphism (`bg-white/[0.02]`, `border-white/[0.08]`), hover lift, and radial hover glow tinted by `item.color`.
- If `href` exists, wrap card in `<a target="_blank" rel="noopener noreferrer">` with `cursor-pointer` and focus-visible ring in `item.color`.
- Preserve alternating left/right layout on desktop and stacked layout on mobile; keep the rail, node, connector line, and scroll-tracked progress bar untouched.

## Out of scope

No changes to the section header, other pages, animations timing, mobile breakpoints, or unrelated components.
