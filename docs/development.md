# Development guide

Standards and step-by-step recipes for changing code. For content changes see [content.md](content.md); for how things fit together see [architecture.md](architecture.md); for visual rules see [design.md](design.md).

## Setup

Requirements: any static file server. Node ≥ 18 only for the helper scripts.

```bash
node scripts/serve.mjs        # or: npx serve .
open http://localhost:8000
```

`file://` won't work (ES modules + `fetch`). `scripts/serve.mjs` sends `Cache-Control: no-store`, so every reload shows your latest edits — with `python3 -m http.server` browsers (Safari especially) can keep stale JS/CSS; empty the cache (Safari: ⌥⌘E) if a fix seems not to apply. Locally, **preview mode is on** (drafts/samples visible); add `?preview=0` to see the live view.

| Command | Purpose |
| --- | --- |
| `node scripts/new-post.mjs "Title" [--tags a,b] [--excerpt "…"] [--slug s]` | create a post (Markdown file + index entry) |
| `node scripts/check-content.mjs` | validate all data/content; exit 1 on errors |
| `node scripts/serve.mjs [port]` | local server with caching disabled; unknown URLs → `404.html` (like Netlify) |

## Code standards

### General
- **No build, no dependencies at runtime.** Native ES modules, plain CSS. Third-party code is vendored in `assets/vendor/` with a pinned version (never a CDN URL at runtime).
- **Relative paths only** (`assets/…`, `data/…`, `post.html?slug=…`) — no leading `/`, so the site works on any host or sub-path.
- **Formatting:** 2-space indent, double quotes, semicolons, trailing commas, ~120-char lines (Prettier defaults with `printWidth: 120`).
- **Comments** explain *why* or describe a module's contract (top-of-file block). No commented-out code.
- **Names:** `camelCase` functions/vars, `PascalCase` for components that return HTML (`Hero`, `DocItem`), `UPPER_CASE` for module constants (`PAGE_SIZE`, `NAV`).

### HTML generation
- Always build markup with `` html`…` `` from `core/dom.js`. Interpolated values are escaped automatically.
- `raw()` only for trusted markup you produced: icons, rendered Markdown, already-escaped strings. Never wrap data from JSON in `raw()`.
- Text from JSON that may contain `**bold**` → `inline(text)`. For meta tags/plain text → `plain(text)`.
- URLs from JSON → `safeUrl(url)` (blocks `javascript:` etc.; returns `""` for empty/`#`). External links → add `${externalAttrs(url)}`.
- Mount with `mount(target, html…)` — it escapes plain strings, so pass `html` results or arrays of them.

### Components
- A component is a pure function: data in → `html` out. No DOM access, no fetching.
- Home-page sections return a descriptor `{ id, title, lead?, action?, body, bare? }` or `null` when empty.
- Interactivity lives in a separate `initX(root)` that uses **event delegation** (`root.addEventListener("click", e => e.target.closest(…))`). No inline handlers.
- Accessibility is part of the component: real `<button>`/`<a>`, `aria-label` on icon-only controls, `aria-expanded`/`aria-pressed` for toggles, headings in order.

### Data
- Load data **only** through `core/data.js` (`loadAll("profile", "posts")`). It caches each file per page.
- Filter drafts/samples **only** with `visible()` / `visiblePosts()` / `buildLibrary()`.
- Dates are parsed with `parseDate()` (local time) — never `new Date("2026-01-05")` (UTC shift).
- New fields must be optional with sensible defaults (`project.links?.source`), so old entries keep working.

### CSS
- Values come from **tokens** in `tokens.css` (colours, type, spacing, radius, shadows). No raw hex colours in component CSS (exceptions: the image lightbox overlay and the generated project cover).
- Every colour token exists in **three blocks**: light `:root`, dark via `@media (prefers-color-scheme: dark)`, and dark via `[data-theme="dark"]`. Change all three.
- Class naming: BEM-style `block`, `block__element`, `block--modifier`; state classes `is-*` / `has-*` (`is-active`, `has-toc`).
- File placement: shared UI → `components.css`; page/section layout and Markdown prose → `pages.css`; resets/primitives/utilities → `base.css`.
- **Mobile-first.** Breakpoints in use: 480, 640, 768, 900, 960 (nav), 1100 (TOC). Check 375 px, 768 px and 1280 px.
- Respect `prefers-reduced-motion` (global rule in `base.css`); keep transitions ≤ 200 ms using `var(--dur)` / `var(--ease)`.

## Recipes

### Add a home-page section
1. Create `assets/js/components/<name>.js` exporting `Name(ctx)` that returns a descriptor or `null`.
2. Import it in `assets/js/pages/home.js` and add it to `SECTIONS` in the desired order. If it needs a new data file, add the name to `loadAll(…)`.
3. To put it in the nav, add `{ label, section: "<id>" }` to `NAV` in `core/layout.js`.
4. Styles in `pages.css` (section layout) or `components.css` (reusable pieces).

### Add a data file
Create `data/<name>.json`, add `"<name>"` to the `loadAll(…)` call of each page that needs it, and add a check for it in `scripts/check-content.mjs`.

### Add a new document type (e.g. "talks")
1. `core/library.js`: add to `DOC_TYPES` (label, plural, page) and map the source in `buildLibrary()`.
2. Create the page shell: copy `post.html` → `talk.html`, set `data-page="talk" data-kind="talk"`.
3. `pages/article.js`: add a `KINDS.talk` entry (folder, back link, items, pager labels) and a header component in `HEADERS`.
4. `components/posts.js`: add an icon to `TYPE_ICONS`.
5. `core/layout.js`: decide which nav item is current for the new page (`isCurrent`).
6. `scripts/check-content.mjs`: validate the new index + files.

### Add a Markdown feature
Renderer hook in `core/markdown.js` (marked v12 positional API) → optional browser enhancement in `core/prose.js` (called from `pages/article.js`) → styles under "Prose extras" in `pages.css` → demonstrate it in `content/posts/writing-guide.md` and document it in `docs/content.md`.

### Add a syntax-highlighting language
```bash
curl -o assets/vendor/hljs/languages/<lang>.min.js \
  https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/es/languages/<lang>.min.js
```
Then add the fence names to `GRAMMARS` in `core/prose.js` (e.g. `rust: "rust", rs: "rust"`).

### Add an icon
Copy the inner SVG paths from [lucide.dev](https://lucide.dev) into `PATHS` in `core/icons.js`; use `icon("name")`. For a new proof link type, also add it to `PROOF_ICONS`.

### Change colours / fonts / spacing
Edit `assets/css/tokens.css` (all three colour blocks). Fonts are loaded from Google Fonts in each HTML `<head>` — update the link in all six HTML files if you change them. The favicon is `assets/favicon.svg`.

### Upgrade a vendored library
Download the pinned new version into `assets/vendor/`, then check:
- **marked** ≥ 13 changes the renderer API to token objects → update `core/markdown.js`.
- **highlight.js** grammars must match the core version.
- **Mermaid** must still expose `window.mermaid` from `mermaid.min.js` (v12 needs Safari 17.4+). Keep the ZenUML plugin (`mermaid-zenuml.min.js`) on a version compatible with it. **Re-apply the local patch** at the top of `mermaid.min.js` (search the new bundle for `svg element not in render tree` and add `&&R` so empty labels don't throw in Safari). ZenUML injects Tailwind CSS, including an unscoped `.container` — the site's container is `:root .container` in `base.css` so it always wins; don't lower that specificity. After upgrading, open the writing guide and check every diagram in the "Diagrams (Mermaid)" gallery renders.

## Manual test checklist

Run `node scripts/check-content.mjs`, then in the browser (light **and** dark, phone width **and** desktop):

- [ ] Home: all sections render, nav scroll-spy works, mobile menu opens/closes (Esc too), photo loads.
- [ ] Experience bullet → work page; draft bullet shows "write-up in progress".
- [ ] Skill tag → Blog with proof panel; Clear works.
- [ ] Blog: search highlights matches, type tabs, tag filter, "+N more" tags, pagination, `/` focuses search.
- [ ] Article: TOC highlights while scrolling, code highlighted + Copy, Mermaid diagram renders and re-renders on theme toggle, image opens in lightbox, share buttons, prev/next.
- [ ] `?preview=0`: no "Sample"/"Draft" badges anywhere.
- [ ] Browser console: no errors.

## Git & deploy

- Work on a branch (e.g. `feature/<thing>`), merge into `main`. Commit messages: short imperative subject (≤ 50 chars), body says *why*.
- Deploy: **Netlify** — <https://portfolio-arcadia-man.netlify.app/>. No build command; publish directory = project root. Drag the whole project folder onto the site's *Deploys* page (or connect the GitHub repo `arcadia-man/portfolio-html` for automatic deploys). Run `node scripts/check-content.mjs` first. Netlify serves `404.html` automatically.
