/**
 * Data access. Every JSON file under /data is fetched at most once per page.
 * Pages never fetch directly — they go through these helpers so sorting,
 * draft filtering and validation live in one place.
 */

const cache = new Map();

async function fetchOk(url, as = "json") {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  return as === "json" ? res.json() : res.text();
}

export function load(name) {
  if (!cache.has(name)) cache.set(name, fetchOk(`data/${name}.json`));
  return cache.get(name);
}

/** Load several data files in parallel: const { profile, posts } = await loadAll("profile", "posts"). */
export async function loadAll(...names) {
  const values = await Promise.all(names.map(load));
  return Object.fromEntries(names.map((n, i) => [n, values[i]]));
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isValidSlug = (slug) => SLUG.test(String(slug ?? ""));

export function loadContent(kind, slug) {
  if (!isValidSlug(slug)) return Promise.reject(new Error("Invalid slug"));
  return fetchOk(`content/${kind}/${slug}.md`, "text");
}

/* ---------- Preview mode ----------
   Preview shows drafts and sample content (e.g. sample testimonials).
   - ON by default when running locally (localhost / 127.0.0.1), so you see everything while writing.
   - OFF by default on the live site, so visitors only see finished content.
   - ?preview=1 / ?preview=0 overrides it for the current browser tab. */

const PREVIEW_KEY = "preview";
export const isLocal = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);

export function isPreview() {
  const param = new URLSearchParams(location.search).get("preview");
  try {
    if (param !== null) sessionStorage.setItem(PREVIEW_KEY, param === "0" ? "0" : "1");
    const stored = sessionStorage.getItem(PREVIEW_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    if (param !== null) return param !== "0";
  }
  return isLocal;
}

/** Drop draft / sample entries unless in preview mode. Works for any data list. */
export function visible(items = []) {
  const preview = isPreview();
  return items.filter((i) => preview || (!i.draft && !i.sample));
}

/** Published posts (plus drafts/samples in preview mode), newest first. */
export const visiblePosts = (posts) =>
  visible(posts).sort((a, b) => String(b.date).localeCompare(String(a.date)));

/** All tags with counts, most used first. */
export function tagCounts(posts) {
  const counts = new Map();
  posts.forEach((p) => (p.tags ?? []).forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** The role with no end date, if any — used for "currently at" copy. */
export function currentRole(experience) {
  for (const company of experience) {
    const role = company.roles.find((r) => !r.end);
    if (role) return { ...role, company: company.company };
  }
  return null;
}
