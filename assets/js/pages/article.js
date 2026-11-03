/**
 * Long-form page for every document type. <body data-kind="…"> picks which:
 *   post.html?slug=x     article       → content/posts/x.md
 *   work.html?slug=x     work write-up → content/work/x.md     (one per experience bullet)
 *   project.html?slug=x  case study    → content/projects/x.md
 */
import { html, raw, inline, mount, $, $$, safeUrl, externalAttrs, setMeta, plain } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { loadAll, loadContent, visible, visiblePosts, isValidSlug, isPreview } from "../core/data.js";
import { workDocs, docHref } from "../core/library.js";
import { mountLayout, renderFatal } from "../core/layout.js";
import { renderMarkdown, isEmptyMarkdown } from "../core/markdown.js";
import { formatDate, formatRange, readingTime } from "../core/format.js";
import { highlightCode, initCodeCopy, initLightbox, initProgress, initShare } from "../core/prose.js";
import { tagHref, StatusBadge } from "../components/posts.js";

const KINDS = {
  post: {
    type: "article",
    folder: "posts",
    back: { href: "blog.html", label: "All posts" },
    items: (d) => visiblePosts(d.posts),
    pager: ["Older post", "Newer post"],
  },
  work: {
    type: "work",
    folder: "work",
    back: { href: "index.html#experience", label: "Experience" },
    // Every bullet has a page (it's linked from the home page), drafts included —
    // a draft shows the bullet plus "write-up in progress" instead of the body.
    items: (d) => workDocs(d.experience),
    pager: ["Previous", "Next"],
  },
  project: {
    type: "project",
    folder: "projects",
    back: { href: "blog.html?type=project", label: "All projects" },
    items: (d) => visible(d.projects).filter((p) => p.caseStudy),
    pager: ["Previous project", "Next project"],
  },
};

/* ---------- Headers ---------- */

const Tags = (tags, label = "Tags") =>
  tags?.length
    ? html`<ul class="tag-list" role="list" aria-label="${label}">
        ${tags.map((t) => html`<li><a class="tag" href="${tagHref(t)}">#${t}</a></li>`)}
      </ul>`
    : "";

const Stack = (stack) =>
  stack?.length
    ? html`<ul class="tag-list" role="list" aria-label="Technologies">${stack.map((t) => html`<li class="tag">${t}</li>`)}</ul>`
    : "";

function PostHeader(post, minutes) {
  return html`
    <p class="article__meta eyebrow">
      <time datetime="${post.date}">${formatDate(post.date)}</time>${minutes ? ` · ${minutes}` : ""} ${StatusBadge(post)}
    </p>
    <h1 class="article__title">${post.title}</h1>
    ${post.excerpt ? html`<p class="article__lead">${post.excerpt}</p>` : ""}
    ${Tags(post.tags)}`;
}

function WorkHeader(work, minutes) {
  return html`
    <p class="article__meta eyebrow"><span class="article__org">${icon("briefcase")}${work.company} · ${work.role}</span></p>
    <p class="article__period mono">${formatRange(work.start, work.end)}${minutes ? ` · ${minutes}` : ""} ${StatusBadge(work)}</p>
    <h1 class="article__title">${work.title}</h1>
    <p class="article__lead">${inline(work.text)}</p>
    ${Stack(work.stack)} ${Tags(work.tags)}`;
}

function ProjectHeader(project, minutes) {
  const source = safeUrl(project.links?.source);
  const demo = safeUrl(project.links?.demo);
  return html`
    <p class="article__meta eyebrow">${project.context}${minutes ? ` · ${minutes}` : ""} ${StatusBadge(project)}</p>
    <h1 class="article__title">${project.title}</h1>
    ${project.summary ? html`<p class="article__lead">${project.summary}</p>` : ""}
    ${Stack(project.stack)}
    ${source || demo
      ? html`<div class="article__links">
          ${source ? html`<a class="btn btn--secondary btn--sm" href="${source}"${externalAttrs(source)}>${icon("github")} Source code</a>` : ""}
          ${demo ? html`<a class="btn btn--primary btn--sm" href="${demo}"${externalAttrs(demo)}>${icon("globe")} Live demo</a>` : ""}
        </div>`
      : ""}`;
}

const HEADERS = { post: PostHeader, work: WorkHeader, project: ProjectHeader };

/* ---------- Body pieces ---------- */

function Toc(headings) {
  return html`
    <nav class="toc" aria-labelledby="toc-title">
      <p class="eyebrow toc__title" id="toc-title">On this page</p>
      <ol role="list">
        ${headings.map((h) => html`<li${h.level === 3 ? html` class="toc__sub"` : ""}><a href="#${h.id}">${raw(h.html)}</a></li>`)}
      </ol>
    </nav>`;
}

function InProgress({ profile }) {
  return html`
    <div class="in-progress">
      <p class="eyebrow">Write-up in progress</p>
      <h2>The detailed story behind this is being written.</h2>
      <p>It will cover the context, the problem, the approach and the results. In the meantime,
        I'm happy to walk through it in person.</p>
      <div class="in-progress__actions">
        <a class="btn btn--primary btn--sm" href="mailto:${profile.email}">${icon("mail")} Ask me about it</a>
        <a class="btn btn--secondary btn--sm" href="${profile.resume}" target="_blank" rel="noopener">${icon("download")} Résumé</a>
      </div>
    </div>`;
}

function ShareBar(title) {
  const url = encodeURIComponent(location.href.replace(/[?&]preview=[^&#]*/, ""));
  return html`
    <div class="share" aria-label="Share">
      <span class="share__label">Share</span>
      <button class="btn btn--secondary btn--sm" type="button" data-share="copy">${icon("link")}<span>Copy link</span></button>
      <button class="btn btn--secondary btn--sm" type="button" data-share="native">${icon("share")}<span>Share</span></button>
      <a class="btn btn--secondary btn--sm" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"
        target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">${icon("linkedin")}<span>LinkedIn</span></a>
    </div>`;
}

function Pager(prev, next, kind) {
  if (!prev && !next) return "";
  const [prevLabel, nextLabel] = KINDS[kind].pager;
  const href = (item) => docHref(KINDS[kind].type, item.slug);
  return html`
    <nav class="pager" aria-label="More">
      ${prev ? html`<a href="${href(prev)}"><span class="eyebrow">← ${prevLabel}</span><strong>${prev.title}</strong></a>` : ""}
      ${next ? html`<a class="pager__next" href="${href(next)}"><span class="eyebrow">${nextLabel} →</span><strong>${next.title}</strong></a>` : ""}
    </nav>`;
}

function NotFound(kind) {
  const { back } = KINDS[kind];
  return html`
    <div class="container" style="padding-block: var(--section-y)">
      <div class="empty-state">
        <h1>Page not found</h1>
        <p>It may have been moved, renamed or not published yet.</p>
        <a class="btn btn--secondary" href="${back.href}">${icon("arrowLeft")} ${back.label}</a>
      </div>
    </div>`;
}

/** Highlight the TOC entry for the heading nearest the top of the viewport. */
function initTocSpy() {
  const links = $$(".toc a");
  if (!links.length) return;
  const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (!visibleEntries.length) return;
      const top = visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      links.forEach((a) => a.classList.remove("is-active"));
      byId.get(top.target.id)?.classList.add("is-active");
    },
    { rootMargin: "-80px 0px -70% 0px" },
  );
  byId.forEach((_, id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* ---------- Page ---------- */

async function main() {
  const kind = KINDS[document.body.dataset.kind] ? document.body.dataset.kind : "post";
  const config = KINDS[kind];
  const slug = new URLSearchParams(location.search).get("slug");

  const data = await loadAll("profile", "posts", "experience", "projects");
  const { profile } = data;
  mountLayout({ page: kind, profile });

  const items = config.items(data);
  const index = isValidSlug(slug) ? items.findIndex((i) => i.slug === slug) : -1;
  const item = items[index];
  if (!item) {
    document.title = `Not found — ${profile.name}`;
    setMeta("robots", "noindex");
    mount("#main", NotFound(kind));
    return;
  }

  // A missing file just means "not written yet" for work pages; elsewhere it's a 404.
  const source = await loadContent(config.folder, slug).catch(() => (kind === "work" ? "" : null));
  if (source === null) {
    mount("#main", NotFound(kind));
    return;
  }

  const preview = isPreview();
  const showBody = !isEmptyMarkdown(source) && (preview || (!item.draft && !item.sample));
  const { html: body, headings } = showBody
    ? renderMarkdown(source, { baseDir: `content/${config.folder}/` })
    : { html: "", headings: [] };
  const hasToc = headings.length >= 3;
  const minutes = showBody ? readingTime(source.replace(/<!--[\s\S]*?-->/g, "")) : "";
  // Posts are newest-first, so the "older" one is next in the list.
  const [prev, next] = kind === "post" ? [items[index + 1], items[index - 1]] : [items[index - 1], items[index + 1]];

  mount(
    "#main",
    html`
      <article class="article container" id="article">
        <div class="page-header" style="padding-bottom:0">
          <a class="back-link" href="${config.back.href}">${icon("arrowLeft")} ${config.back.label}</a>
        </div>
        <header class="article__header">${HEADERS[kind](item, minutes)}</header>
        <div class="article__layout${hasToc ? " has-toc" : ""}">
          <div class="article__main">
            ${showBody ? html`<div class="prose">${raw(body)}</div>` : InProgress({ profile })}
            ${showBody ? ShareBar(item.title) : ""}
          </div>
          ${hasToc ? Toc(headings) : ""}
        </div>
        ${Pager(prev, next, kind)}
      </article>`,
  );

  const description = plain(item.excerpt ?? item.summary ?? item.text ?? "");
  document.title = `${item.title} — ${profile.name}`;
  setMeta("description", description);
  setMeta("og:title", item.title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:type", kind === "post" ? "article" : "website", "property");
  if (!showBody) setMeta("robots", "noindex");

  const article = $("#article");
  if (showBody) {
    const prose = $(".prose", article);
    initCodeCopy(prose);
    initLightbox(prose);
    initProgress(article);
    initShare(article, { title: item.title });
    highlightCode(prose);
    initTocSpy();
  }
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

main().catch(renderFatal);
