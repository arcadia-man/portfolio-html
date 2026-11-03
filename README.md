# Portfolio — Pritam Kumar Maurya

Static personal site: plain HTML, CSS and JavaScript modules. **No build step, no framework.**
All content lives in `data/*.json` and `content/**/*.md` — you should rarely need to touch code.

## Run locally

The site loads JSON/Markdown with `fetch`, which browsers block on `file://`. Serve the folder:

```bash
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

## Preview mode vs live view

| | Locally (`localhost`) | Live site |
| --- | --- | --- |
| Default | **Preview** — drafts and samples visible | **Live** — only finished content |
| Toggle | `?preview=0` / `?preview=1` (remembered per tab) | same |

Anything marked `"draft": true` or `"sample": true` in any data file is **only** shown in preview.
A yellow bar at the top tells you which mode you're in.

## Pages

| URL | What | Content |
| --- | --- | --- |
| `index.html` | Home: hero, about, experience, projects, skills, appreciation, latest writing, contact | `data/*.json` |
| `blog.html` | Every document — search, type tabs, tags, skill proof, pagination | all of the below |
| `post.html?slug=x` | Article | `data/posts.json` + `content/posts/x.md` |
| `work.html?slug=x` | Write-up for **one experience bullet** | `data/experience.json` + `content/work/x.md` |
| `project.html?slug=x` | Project case study | `data/projects.json` + `content/projects/x.md` |
| `404.html` | Not-found page (used automatically by most static hosts) | — |

Blog URLs are shareable: `blog.html?q=kafka&type=work&tag=debugging&skill=kafka&page=2`.

## Structure

```
data/
  profile.json        name, headline, bio, metrics, email, phone, whatsapp, socials, résumé, photo
  experience.json     companies → roles → highlights (each highlight = one clickable write-up)
  projects.json       project cards (cover image, stack, source/demo links, case study)
  skills.json         skill groups; each skill can list "proof" links
  testimonials.json   Appreciation section
  posts.json          articles index
  education.json  achievements.json

content/
  posts/*.md          article bodies
  work/*.md           one per experience highlight (slug = file name)
  projects/*.md       case-study bodies
  images/             images used by Markdown and JSON
  _templates/         copy these to start something new

assets/
  css/  tokens.css (colours, type, spacing) · base.css · components.css · pages.css
  js/   core/        data, library (merges all documents), search, markdown, prose (code, images, share), layout, theme
        components/  one file per home-page section
        pages/       entry point per HTML page (home, blog, article)
  vendor/            marked (Markdown) + highlight.js (syntax colours) — vendored, no CDN at runtime
  docs/              résumé PDF
```

## Common tasks

### Write up an experience bullet
Every bullet in `data/experience.json` has a `slug` and links to `work.html?slug=<slug>`.
1. Open `content/work/<slug>.md` — it already contains an outline inside a comment.
2. Write below (or replace) the comment. Until there's real text, the page shows "write-up in progress".
3. Set `"draft": false` on that highlight → the full write-up goes live and appears on the Blog under **Work**.

### Publish an article
1. Copy `content/_templates/post.md` → `content/posts/my-post.md`.
2. Add `{ "slug": "my-post", "title", "date": "YYYY-MM-DD", "excerpt", "tags": [], "draft": true }` to `data/posts.json`.
3. Check it locally, then set `"draft": false`.

### Add a project
Add it to `data/projects.json`. Optional: `"cover"` image, `"links": { "source", "demo" }` (empty = hidden),
`"caseStudy": true` + `content/projects/<slug>.md` for a full page, or `"workDoc": "<highlight-slug>"` to link a work write-up instead.
`"featured": true` shows it on the home page; all case studies are listed on the Blog under **Projects**.

### Add proof for a skill
Every skill links to `blog.html?skill=<skill>`, which shows:
- links you add under `"proof"` in `data/skills.json` —
  `{ "label": "Repo name", "url": "https://github.com/…", "type": "github" }`
  (types: `github`, `demo`, `article`, `certificate`, `video`, `link`)
- source/demo links of any project whose stack mentions the skill
- every write-up that mentions it. `"match": ["kafka", "event-driven"]` controls which words count (whole words).

The number on each skill tag on the home page = how much proof exists.

### Add appreciation
Add `{ "quote", "name", "role", "company", "relationship", "photo", "url" }` to `data/testimonials.json`.
`url` (e.g. the LinkedIn recommendation) adds a link icon; `photo` replaces the initials avatar. The section hides itself when empty.

### Images
Put files in `content/images/`. In Markdown, use a path relative to the `.md` file — it then also works in VS Code's preview:

```markdown
![Alt text](../images/diagram.svg "Optional caption")
```

SVG, PNG, JPG and WebP all work. Images open full-size on click. In JSON (project `cover`, testimonial `photo`)
use a path from the site root: `content/images/cover.svg`.

### Markdown features
See the sample post **"Writing guide: every formatting feature"** (`content/posts/writing-guide.md`):
headings + auto table of contents, callouts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`),
syntax-highlighted code with copy buttons (java, js/ts, sql, yaml, bash, json, python, ruby, go, kotlin, lua, graphql, xml),
tables, task lists, images with captions, collapsible `<details>`, `<kbd>` keys.
Article pages also get a reading-progress bar, share buttons and previous/next links.

## Before going live — replace the sample data

Everything below is placeholder, marked `sample`/`draft` so it can't leak to the live site — but replace it:

- [ ] `data/profile.json` → real GitHub + LinkedIn URLs (remove `"sample": true`), local photo in `content/images/`
- [ ] `data/testimonials.json` → real recommendations (delete the 3 samples)
- [ ] `data/posts.json` + `content/posts/` → delete the 4 sample articles (keep `writing-guide.md` as a reference if you like, it stays hidden)
- [ ] `data/projects.json` → delete the sample "Distributed Rate Limiter" (+ `content/projects/rate-limiter.md`); add real source/demo links
- [ ] `data/skills.json` → replace sample `proof` links
- [ ] `content/work/saga-orchestrator.md`, `notification-service.md`, `picklist-dashboard.md` → sample write-ups, rewrite them
- [ ] `content/images/` → sample diagrams/mock-ups; swap for real (redacted) ones
- [ ] Open the site with `?preview=0` to see exactly what visitors will see

## Deploy

Any static host — upload the folder as-is: GitHub Pages, Netlify, Vercel, Cloudflare Pages.
All paths are relative, so it also works from a sub-path (e.g. `username.github.io/portfolio/`).

## Scaling notes

- **Search** is in-memory over titles, excerpts, tags and context — fine for hundreds of documents.
  Past ~1,000, swap `assets/js/core/search.js` for a prebuilt index (Pagefind / MiniSearch).
- **SEO**: pages render in the browser from JSON. Google indexes this, but if blog traffic becomes important,
  move to a static-site generator (Astro / Eleventy) — `data/` and `content/` port over unchanged.
- **Writing in a browser** instead of editing files: add Decap CMS (git-based, free) on top of this structure.
- Raw HTML inside Markdown is allowed (content is first-party). Add DOMPurify in `core/markdown.js` if that ever changes.
