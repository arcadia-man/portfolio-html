# Pritam Kumar Maurya — Portfolio & Blog

Personal site: portfolio, experience write-ups, project case studies and a searchable blog.
Plain HTML, CSS and JavaScript modules — **no framework, no build step**. Content lives in `data/*.json` and `content/**/*.md`.

Live: <https://portfolio-arcadia-man.netlify.app/>

## Quick start

```bash
node scripts/serve.mjs           # then open http://localhost:8000
```

Locally you're in **preview mode**: drafts and sample content are visible (yellow bar at the top). Add `?preview=0` to see exactly what visitors see.

## Common tasks

| Task | How |
| --- | --- |
| New blog post | `node scripts/new-post.mjs "Title" --tags a,b` → write `content/posts/<slug>.md` → set `"draft": false` in `data/posts.json` |
| Write up an experience bullet | edit `content/work/<slug>.md`, then `"draft": false` on that highlight in `data/experience.json` |
| Add a project | entry in `data/projects.json` (+ `content/projects/<slug>.md` for a case study) |
| Add proof for a skill | `"proof"` links in `data/skills.json` |
| Add a testimonial | `data/testimonials.json` |
| Edit profile / metrics / photo | `data/profile.json` (photo file: `content/images/profile.jpg`) |
| Check everything before upload | `node scripts/check-content.mjs` |

## Documentation

| Doc | Read it when you want to… |
| --- | --- |
| [docs/content.md](docs/content.md) | write a post or work write-up, add a project, skill proof, testimonial, images or diagrams — includes the new-post checklist and every Markdown feature |
| [docs/development.md](docs/development.md) | change code: standards, recipes (new section, page type, Markdown feature, icon, language), test checklist, deploy |
| [docs/architecture.md](docs/architecture.md) | understand how it works: folders, page flow, modules, the document library, preview mode, Markdown pipeline |
| [docs/design.md](docs/design.md) | keep the look consistent: design direction, tokens, components, responsive and accessibility rules |
| [AGENTS.md](AGENTS.md) | brief an AI coding agent: conventions and owner preferences |

## Deploy

Hosted on **Netlify** — <https://portfolio-arcadia-man.netlify.app/>. Publish by dragging the whole project folder onto
the site's **Deploys** page in Netlify (or connect the GitHub repo for automatic deploys). No build command; publish directory = the
project root. Netlify serves `404.html` for unknown URLs automatically. Run `node scripts/check-content.mjs` first.
