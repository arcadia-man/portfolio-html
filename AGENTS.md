# AGENTS.md — guide for AI coding agents working on this repo

Personal portfolio + blog of Pritam Kumar Maurya (Software Development Engineer). Static site: plain HTML, CSS, native ES modules. **No framework, no build step.** Content in `data/*.json` + `content/**/*.md`.

Full docs live in `docs/` — read the relevant one before changing anything:
- `docs/architecture.md` — structure, page flow, core modules, library model, preview mode, Markdown pipeline
- `docs/development.md` — code standards, recipes, manual test checklist, deploy
- `docs/content.md` — content workflows (new post checklist, work write-ups, projects, skills, images, Mermaid)
- `docs/design.md` — design direction, tokens, component rules, rejected styles

## Commands

```bash
node scripts/serve.mjs                       # run locally, no caching (file:// does not work)
node scripts/new-post.mjs "Title" --tags a,b # new post: md file + data/posts.json entry (draft)
node scripts/check-content.mjs               # validate data/content; exit 1 on errors
```

## Non-negotiables

- Build all markup with `` html`…` `` (core/dom.js); `raw()` only for trusted markup. URLs from data through `safeUrl()`.
- Load data only via `core/data.js`; filter drafts/samples only via `visible()` / `buildLibrary()`.
- Relative paths only (no leading `/`), so the site works on any host or sub-path. No runtime CDNs — vendor libs into `assets/vendor/`.
- Colours only via tokens in `assets/css/tokens.css`, defined in all three theme blocks.
- Empty data hides its UI. Placeholder content must be flagged `"sample": true` or `"draft": true`.
- marked is v12 → positional renderer API (`code(code, lang, escaped)`), not token objects.

## Owner's preferences (decided — don't re-litigate)

- **Look:** sleek, professional, **monochrome**. Rejected: cursive/"childish" fonts, colourful gradients/glows (indigo-pink-cyan was explicitly rejected as "dirty"/too colourful), alternating section background bands, heavy outlined boxes. Use soft shadows (`--shadow-soft`) and alpha fills instead of borders.
- **Home background:** one continuous canvas — soft top light + fading grid, no colour, no hard section edges.
- **Experience:** text justified (experience only, not the blog); every bullet visible (no "show more") and clickable to its `work.html?slug=` write-up.
- **Skills:** every skill links to the Blog skill-proof view (`blog.html?skill=`).
- **Blog** holds all documents: articles, work write-ups, case studies.
- **Sample content** exists for every feature so the owner can see it; it's preview-only and listed by `check-content.mjs`.
- **Workflow:** owner tests manually and prefers fast iteration — keep automated browser testing minimal unless asked. Answers short and direct.
- **Deploy:** Netlify — <https://portfolio-arcadia-man.netlify.app/>, no build step, publish directory = repo root. The owner deploys by dragging the folder onto Netlify; the GitHub repo is `arcadia-man/portfolio-html`.

## Folder layout

- `assets/` — code only: `css/`, `js/`, `vendor/`, `favicon.svg`
- `content/` — everything written or uploaded: `posts/`, `work/`, `projects/` (Markdown), `templates/`, `images/` (`profile.jpg`, `covers/`, `diagrams/`, `screenshots/`), `files/` (résumé)
- `data/` — JSON · `docs/` — documentation · `scripts/` — Node helpers

## Where things are

| Need | Go to |
| --- | --- |
| Home section order | `assets/js/pages/home.js` → `SECTIONS` |
| Nav items | `assets/js/core/layout.js` → `NAV` |
| Blog page size / tag limit | `assets/js/pages/blog.js` → `PAGE_SIZE`, `VISIBLE_TAGS` |
| Document types | `assets/js/core/library.js` → `DOC_TYPES`, `buildLibrary` |
| Article kinds (post/work/project) | `assets/js/pages/article.js` → `KINDS` |
| Markdown extensions | `assets/js/core/markdown.js`; browser enhancements in `core/prose.js` |
| Code languages | `core/prose.js` → `GRAMMARS` + `assets/vendor/hljs/languages/` |
| Icons | `core/icons.js` → `PATHS`, `PROOF_ICONS` |
| Design tokens | `assets/css/tokens.css` |
