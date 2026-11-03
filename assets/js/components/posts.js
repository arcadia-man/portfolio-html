import { html, raw } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { formatDate, formatRange } from "../core/format.js";
import { highlight } from "../core/search.js";
import { DOC_TYPES, docHref } from "../core/library.js";

export const postHref = (slug) => docHref("article", slug);
export const tagHref = (tag) => `blog.html?tag=${encodeURIComponent(tag)}`;

const TYPE_ICONS = { article: "fileText", work: "briefcase", project: "folder" };

function when(doc) {
  if (doc.type === "work") return html`<span>${formatRange(doc.start, doc.end)}</span>`;
  if (doc.date) return html`<time datetime="${doc.date}">${formatDate(doc.date)}</time>`;
  return "";
}

export function StatusBadge(item) {
  if (item.sample) return html`<span class="badge badge--sample">Sample</span>`;
  if (item.draft) return html`<span class="badge">Draft</span>`;
  return "";
}

/**
 * One row in a document list (home "Latest writing" + Blog page).
 * @param {object} doc     library document (core/library.js)
 * @param {object} [opts]
 * @param {2|3} [opts.level=3]    heading level for the title
 * @param {string[]} [opts.tokens] search terms to highlight
 */
export function DocItem(doc, { level = 3, tokens = [] } = {}) {
  const h = `h${level}`;
  return html`
    <li class="post-item">
      <div class="post-item__meta">
        <span class="doc-type doc-type--${doc.type}">${icon(TYPE_ICONS[doc.type])}${DOC_TYPES[doc.type].label}</span>
        ${when(doc)} ${StatusBadge(doc)}
      </div>
      ${doc.context ? html`<p class="post-item__context">${highlight(doc.context, tokens)}</p>` : ""}
      ${raw(`<${h} class="post-item__title">`)}<a href="${doc.href}">${highlight(doc.title, tokens)}</a>${raw(`</${h}>`)}
      ${doc.excerpt ? html`<p class="post-item__excerpt">${highlight(doc.excerpt, tokens)}</p>` : ""}
      ${doc.tags?.length
        ? html`<ul class="tag-list" role="list" aria-label="Tags">
            ${doc.tags.map((t) => html`<li><a class="tag" href="${tagHref(t)}" data-tag="${t}">#${t}</a></li>`)}
          </ul>`
        : ""}
    </li>`;
}

/** Home-page section: newest documents of any type + link to the Blog. */
export function Writing({ library = [], limit = 3 }) {
  if (!library.length) return null;
  return {
    id: "writing",
    title: "Latest writing",
    lead: "Articles, deep dives into my work, and project write-ups.",
    action: html`<a class="text-link" href="blog.html">Visit the blog ${icon("arrowRight")}</a>`,
    body: html`<ol class="post-list" role="list">${library.slice(0, limit).map((d) => DocItem(d))}</ol>`,
  };
}
