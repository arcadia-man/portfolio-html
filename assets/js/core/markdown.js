/**
 * Markdown → HTML for posts, work write-ups and case studies (marked, vendored).
 *
 * Extras on top of GitHub-flavoured Markdown:
 *  - heading ids + "#" anchor links; h2/h3 collected for the table of contents
 *  - relative image/file paths resolve against the .md file's folder, exactly like
 *    the VS Code / GitHub preview: ![x](../images/diagram.svg) from content/posts/
 *  - ![alt](src "Caption")  → <figure> with a caption; images open full-size on click
 *  - > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]  → callout boxes
 *  - code blocks get a language label, a copy button and syntax highlighting (core/prose.js)
 *  - tables and code scroll horizontally on small screens
 *
 * Raw HTML in Markdown is passed through (content is first-party). Add DOMPurify
 * here if Markdown ever comes from untrusted sources.
 */
import { Marked } from "../../vendor/marked.esm.js";
import { esc, isExternal } from "./dom.js";
import { slugify } from "./format.js";

const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");

const CALLOUTS = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

/** Resolve a path written relative to the .md file into a URL the page can load. */
function resolver(baseDir) {
  const base = new URL(baseDir, location.href);
  return (href) => {
    if (!href || /^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(href)) return href; // absolute, protocol, anchor, root
    if (/\.html(\?|#|$)/i.test(href)) return href; // links to site pages stay page-relative
    return new URL(href, base).href;
  };
}

/**
 * @param {string} source  Markdown text
 * @param {object} [opts]
 * @param {string} [opts.baseDir]  folder of the .md file, e.g. "content/posts/"
 */
export function renderMarkdown(source, { baseDir = "" } = {}) {
  const headings = [];
  const usedIds = new Map();
  const resolve = resolver(baseDir);

  const renderer = {
    heading(text, level) {
      const base = slugify(stripTags(text)) || "section";
      const n = usedIds.get(base) ?? 0;
      usedIds.set(base, n + 1);
      const id = n ? `${base}-${n}` : base;
      if (level === 2 || level === 3) headings.push({ id, level, html: stripTags(text) });
      return `<h${level} id="${id}">${text}<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a></h${level}>\n`;
    },

    code(code, infostring, escaped) {
      const lang = (infostring || "").match(/^\S*/)?.[0] ?? "";
      const body = escaped ? code : esc(code);
      const label = lang && lang !== "text" ? `<span class="code-block__lang">${esc(lang)}</span>` : "";
      return `<div class="code-block">${label}<button class="code-block__copy" type="button" aria-label="Copy code">Copy</button><pre tabindex="0"><code${
        lang ? ` class="language-${esc(lang)}"` : ""
      }>${body}</code></pre></div>\n`;
    },

    blockquote(quote) {
      const m = quote.match(/^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
      if (!m) return false; // default rendering
      const kind = m[1].toUpperCase();
      const body = quote.replace(m[0], "<p>").replace(/<p>\s*<\/p>/, "");
      return `<div class="callout callout--${kind.toLowerCase()}" role="note"><p class="callout__title">${CALLOUTS[kind]}</p>${body}</div>\n`;
    },

    paragraph(text) {
      // An image on its own line becomes a <figure> — don't wrap it in <p>.
      if (/^\s*<figure[\s\S]*<\/figure>\s*$/.test(text)) return `${text}\n`;
      return false;
    },

    table(header, body) {
      return `<div class="table-wrap" tabindex="0"><table><thead>${header}</thead>${body ? `<tbody>${body}</tbody>` : ""}</table></div>\n`;
    },

    link(href, title, text) {
      if (!href) return text;
      const url = resolve(href);
      const t = title ? ` title="${esc(title)}"` : "";
      const ext = isExternal(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${esc(url)}"${t}${ext}>${text}</a>`;
    },

    image(href, title, text) {
      if (!href) return esc(text);
      const img = `<img src="${esc(resolve(href))}" alt="${esc(text)}" loading="lazy" decoding="async">`;
      return title ? `<figure>${img}<figcaption>${esc(title)}</figcaption></figure>` : img;
    },
  };

  const md = new Marked({ gfm: true, renderer });
  return { html: md.parse(source), headings };
}

/** True when a Markdown file has no real content yet (only whitespace / HTML comments). */
export const isEmptyMarkdown = (source) => !String(source ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
