/**
 * Tiny, dependency-free HTML templating.
 *
 *   html`<p>${userText}</p>`   → interpolations are HTML-escaped by default
 *   html`<div>${raw(svg)}</div>` → raw() opts out of escaping (trusted markup only)
 *   Arrays are joined, null/undefined/false render nothing, nested html`` is not re-escaped.
 */

class SafeHTML {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const raw = (value) => new SafeHTML(String(value ?? ""));

function toHTML(value) {
  if (value == null || value === false) return "";
  if (value instanceof SafeHTML) return value.value;
  if (Array.isArray(value)) return value.map(toHTML).join("");
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += toHTML(values[i]) + strings[i + 1];
  return new SafeHTML(out);
}

/** Escapes text, then turns **bold** into <strong>. For short strings in JSON data. */
export const inline = (text) => raw(esc(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"));

/** Strips the inline **bold** markers — for plain-text contexts (meta tags, titles). */
export const plain = (text) => String(text ?? "").replace(/\*\*(.+?)\*\*/g, "$1");

/** Only allow safe URL schemes from data files. Empty string = "no link". */
export function safeUrl(url) {
  const value = String(url ?? "").trim();
  if (!value || value === "#") return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return ""; // javascript:, data:, etc.
  return value; // relative path or #anchor
}

export const isExternal = (url) => /^https?:\/\//i.test(url) && !url.startsWith(location.origin);

/** Attributes for links that leave the site. */
export const externalAttrs = (url) => (isExternal(url) ? raw(' target="_blank" rel="noopener noreferrer"') : "");

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Render html`` output (or an array of it) into a node. Plain strings are escaped, never parsed. */
export function mount(target, content) {
  const node = typeof target === "string" ? $(target) : target;
  if (node) node.innerHTML = toHTML(content);
  return node;
}

export function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function setMeta(name, content, attr = "name") {
  if (!content) return;
  let node = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, name);
    document.head.append(node);
  }
  node.setAttribute("content", content);
}
