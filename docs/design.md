# Design system

The visual rules for this site. They reflect deliberate decisions — keep to them unless the owner asks otherwise.

## Direction

**Sleek, professional, monochrome.** Clean type, generous whitespace, soft depth. Colour is reserved for meaning (links, focus, status), never decoration.

Decisions already made (don't reintroduce):

| ✗ Rejected | ✓ Instead |
| --- | --- |
| Hand-drawn / cursive fonts, tilted "sticky note" cards, emoji decoration | Inter + JetBrains Mono, straight layouts |
| Colourful gradients (indigo / pink / cyan glows, gradient buttons or text) | Monochrome: white/grey/black, one blue accent for links & focus |
| Alternating section background bands, hard borders between sections | One continuous home canvas |
| Outlined boxes everywhere | Soft elevation (`--shadow-soft`) and alpha fills (`--fill`) |
| Self-rated skill progress bars | Skill tags that link to proof |
| "Show N more" collapsing experience bullets | All bullets visible, each one clickable |
| Placeholder "coming soon" content on the live site | Empty = hidden; samples only in preview |

## Tokens (`assets/css/tokens.css`)

| Group | Tokens |
| --- | --- |
| Surfaces | `--bg`, `--bg-subtle`, `--surface`, `--surface-2`, `--page-bg` (set on `body`), `--home-bg` |
| Text | `--text`, `--text-muted`, `--text-subtle` |
| Accent | `--accent` (#3451d1 light / #8ea3ff dark), `--accent-hover`, `--accent-soft`, `--accent-contrast` |
| Lines & fills | `--divider` (faint lines), `--fill` / `--fill-hover` (chips, tags, hover backgrounds), `--border`, `--border-strong` (inputs only) |
| Elevation | `--shadow-soft` (resting cards), `--shadow-lift` (hover), `--shadow-sm`, `--shadow` |
| Home canvas | `--glow-a` (soft top light), `--glow-b`, `--grid-line` |
| Type | `--font-sans` (Inter), `--font-mono` (JetBrains Mono), `--fs-2xs` … `--fs-3xl` (fluid `clamp`) |
| Space | `--space-1` (4px) … `--space-16` (64px), `--section-y`, `--gutter`, `--container` (1120px), `--container-prose` (720px) |
| Shape & motion | `--radius-sm/--radius/--radius-lg/--radius-full`, `--dur` (180ms), `--ease` |
| Code & callouts | `--code-bg`, `--syn-*`, `--c-important/--c-warning/--c-caution` |

Dark mode: OS preference by default, `[data-theme]` on `<html>` when the visitor toggles. Each colour token is defined in three blocks — keep them in sync.

## Typography

- Inter for everything; JetBrains Mono for metadata (dates, eyebrows, tags, code).
- Headings: semibold, tight negative letter-spacing, `text-wrap: balance`.
- Body: 16–17px, line-height 1.65; prose 1.75.
- Eyebrow labels: mono, `--fs-xs`, `--text-subtle`.
- **Experience text is justified** (with hyphenation) — experience section only, nowhere else.

## Surfaces & depth

- Cards (`.card`, metrics, About cards, skills, testimonials, project cards, proof links) = `--surface` + `--shadow-soft`, no border. Hover = `--shadow-lift` + `translateY(-2px)`.
- Chips/tags/filters/tabs = `--fill` background, no border.
- Lines only where structure needs them (timeline rail, tables, list separators) and always `--divider`.
- Radius: 16px cards, 10px buttons/inputs, 6px tags.

## Home canvas

`body[data-page="home"]` uses `--home-bg` (#f9f9fa light / #0b0c0f dark) with:
- a soft white light from the top over a fine grid that fades out (`body::before`);
- a faint neutral light behind Projects and Appreciation;
- the contact card has the same fading grid;
- the header is transparent at the top and gains a blurred background once scrolled.

No colour in any of it.

## Components at a glance

| Component | Notes |
| --- | --- |
| Header | Sticky, transparent at top. Desktop nav ≥ 960px, menu panel below. Résumé button ≥ 640px. |
| Buttons | `.btn--primary` (text-colour fill, accent on hover), `.btn--secondary` (surface + soft shadow), `.btn--sm`. Min height 44px. |
| Timeline | Rail + dots; current role dot uses accent. Each highlight is a link with a fill hover and "Read more →". |
| Project card | 16:9 cover; without an image, a generated charcoal cover with initials. |
| Badges | `Draft` (yellow), `Sample` (accent-soft) — preview only. |
| Prose | 720px measure; callouts tinted by type; code blocks on `--code-bg`; figures with captions; Mermaid diagrams on a surface card. |

## Responsive

Mobile-first. Verify at 375px (phone), 768px (tablet), 1280px+ (laptop). No horizontal page scroll; wide content (code, tables, diagrams, filter chips on mobile) scrolls inside its own box. Tap targets ≥ 40px.

## Accessibility

Skip link, landmarks, one `h1` per page, visible `:focus-visible` ring (accent), `aria-*` on toggles, keyboard support (`/` search, `Esc` closes menu/lightbox), reduced-motion respected, text contrast ≥ 4.5:1 in both themes.
