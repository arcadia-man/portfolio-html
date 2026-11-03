/**
 * Client-side search over library documents (see core/library.js).
 * Every whitespace-separated term must match somewhere (AND semantics).
 * Ranking: title ×3, tags ×2, excerpt/context ×1, then newest first.
 *
 * Fine for hundreds of documents. Past ~1,000, swap this module for a prebuilt
 * index (e.g. Pagefind or MiniSearch) without touching the blog page.
 */
import { esc, raw } from "./dom.js";

export const tokenize = (query) =>
  String(query ?? "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

/**
 * @param {object[]} docs
 * @param {object} opts
 * @param {string} [opts.query]
 * @param {string} [opts.tag]
 * @param {string} [opts.type]   "article" | "work" | "project"
 * @param {Set<object>} [opts.within] restrict to these docs (e.g. a skill's evidence)
 */
export function searchDocs(docs, { query = "", tag = "", type = "", within } = {}) {
  const tokens = tokenize(query);
  const pool = docs.filter(
    (d) => (!type || d.type === type) && (!tag || (d.tags ?? []).includes(tag)) && (!within || within.has(d)),
  );
  if (!tokens.length) return { results: pool, tokens };

  const scored = [];
  for (const doc of pool) {
    const title = doc.title.toLowerCase();
    const tags = (doc.tags ?? []).join(" ").toLowerCase();
    const body = `${doc.excerpt ?? ""} ${doc.context ?? ""} ${(doc.stack ?? []).join(" ")}`.toLowerCase();
    let score = 0;
    let matchesAll = true;
    for (const t of tokens) {
      const s = (title.includes(t) ? 3 : 0) + (tags.includes(t) ? 2 : 0) + (body.includes(t) ? 1 : 0);
      if (!s) {
        matchesAll = false;
        break;
      }
      score += s;
    }
    if (matchesAll) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score || String(b.doc.date).localeCompare(String(a.doc.date)));
  return { results: scored.map((s) => s.doc), tokens };
}

/** Wrap matched terms in <mark>, escaping everything else. */
export function highlight(text, tokens) {
  const source = String(text ?? "");
  if (!tokens?.length) return raw(esc(source));
  const lower = source.toLowerCase();
  const ranges = [];
  for (const t of tokens) {
    let i = lower.indexOf(t);
    while (i !== -1) {
      ranges.push([i, i + t.length]);
      i = lower.indexOf(t, i + t.length);
    }
  }
  if (!ranges.length) return raw(esc(source));
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (const [s, e] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  let out = "";
  let pos = 0;
  for (const [s, e] of merged) {
    out += esc(source.slice(pos, s)) + "<mark>" + esc(source.slice(s, e)) + "</mark>";
    pos = e;
  }
  return raw(out + esc(source.slice(pos)));
}
