/**
 * The "library" — everything readable on the site, normalised into one shape so
 * the Blog page can search and filter across all of it:
 *
 *   article → data/posts.json                    + content/posts/<slug>.md     (post.html)
 *   work    → data/experience.json  highlights   + content/work/<slug>.md      (work.html)
 *   project → data/projects.json ("caseStudy")   + content/projects/<slug>.md  (project.html)
 *
 * Also maps skills (data/skills.json) to their evidence: write-ups that mention
 * the skill, links you list under "proof", and project source/demo links.
 */
import { plain, safeUrl } from "./dom.js";
import { isPreview } from "./data.js";
import { slugify } from "./format.js";

export const DOC_TYPES = {
  article: { label: "Article", plural: "Articles", page: "post.html" },
  work: { label: "Work", plural: "Work", page: "work.html" },
  project: { label: "Project", plural: "Projects", page: "project.html" },
};

export const docHref = (type, slug) => `${DOC_TYPES[type].page}?slug=${encodeURIComponent(slug)}`;
export const workHref = (slug) => docHref("work", slug);

/** One entry per experience highlight, carrying its company/role context. */
export function workDocs(experience = []) {
  const out = [];
  for (const company of experience) {
    for (const role of company.roles ?? []) {
      for (const h of role.highlights ?? []) {
        if (!h.slug) continue;
        out.push({ ...h, company: company.company, role: role.title, start: role.start, end: role.end, stack: role.stack ?? [] });
      }
    }
  }
  return out;
}

/** All readable documents, newest first. Drafts only in preview mode. */
export function buildLibrary({ posts = [], experience = [], projects = [] }, { includeDrafts = isPreview() } = {}) {
  const docs = [
    ...posts.map((p) => ({
      type: "article",
      slug: p.slug,
      title: p.title,
      date: p.date ?? "",
      excerpt: p.excerpt ?? "",
      tags: p.tags ?? [],
      draft: Boolean(p.draft),
      sample: Boolean(p.sample),
    })),
    ...workDocs(experience).map((w) => ({
      type: "work",
      slug: w.slug,
      title: w.title,
      date: w.end ?? w.start, // sort current-role work by start, so it doesn't pin to the top forever
      start: w.start,
      end: w.end,
      excerpt: plain(w.text),
      context: `${w.company} · ${w.role}`,
      tags: w.tags ?? [],
      stack: w.stack,
      draft: Boolean(w.draft),
      sample: Boolean(w.sample),
    })),
    ...projects
      .filter((p) => p.caseStudy)
      .map((p) => ({
        type: "project",
        slug: p.slug,
        title: p.title,
        date: p.date ?? "",
        excerpt: p.summary ?? "",
        context: p.context,
        tags: p.tags ?? [],
        stack: p.stack ?? [],
        draft: Boolean(p.draft),
        sample: Boolean(p.sample),
      })),
  ];

  return docs
    .filter((d) => includeDrafts || (!d.draft && !d.sample))
    .map((d) => ({ ...d, href: docHref(d.type, d.slug) }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** Count of documents per type, in DOC_TYPES order, skipping empty types. */
export function typeCounts(docs) {
  return Object.keys(DOC_TYPES)
    .map((type) => [type, docs.filter((d) => d.type === type).length])
    .filter(([, n]) => n > 0);
}

/* ---------- Skills → evidence ---------- */

const stripParens = (s) => String(s).replace(/\s*\(.*?\)\s*/g, " ").trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const skillSlug = (name) => slugify(stripParens(name).replace(/\./g, "-"));

/** Flatten skill groups. Items may be plain strings or { name, match?, proof? }. */
export function skillList(groups = []) {
  return groups.flatMap((g) =>
    (g.items ?? []).map((item) => {
      const skill = typeof item === "string" ? { name: item } : item;
      const short = stripParens(skill.name);
      return {
        ...skill,
        group: g.group,
        short,
        slug: skillSlug(skill.name),
        match: (skill.match?.length ? skill.match : [short]).map((t) => t.toLowerCase()),
        proof: skill.proof ?? [],
      };
    }),
  );
}

/** Whole-word matcher: "rest" matches "REST APIs" but not "interest" or "restore". */
function matcher(terms) {
  const re = new RegExp(`(?:^|[^a-z0-9])(?:${terms.map(escapeRe).join("|")})(?![a-z0-9])`, "i");
  return (text) => re.test(text);
}

const docText = (d) => [d.title, d.excerpt, d.context, (d.tags ?? []).join(" "), (d.stack ?? []).join(" ")].join(" ");

/**
 * Evidence for one skill:
 *   docs  — write-ups whose title/text/tags/stack mention it
 *   links — "proof" links from skills.json + source/demo links of projects that use it
 */
export function skillEvidence(skill, { library = [], projects = [] }) {
  const test = matcher(skill.match);
  const docs = library.filter((d) => test(docText(d)));

  const preview = isPreview();
  const links = skill.proof
    .filter((p) => preview || !p.sample)
    .map((p) => ({ ...p, url: safeUrl(p.url) }))
    .filter((p) => p.url);
  for (const p of projects) {
    if (p.sample && !preview) continue;
    if (!test([p.title, p.summary, (p.stack ?? []).join(" "), (p.tags ?? []).join(" ")].join(" "))) continue;
    const source = safeUrl(p.links?.source);
    const demo = safeUrl(p.links?.demo);
    if (source) links.push({ label: `${p.title} — source code`, url: source, type: "github" });
    if (demo) links.push({ label: `${p.title} — live demo`, url: demo, type: "demo" });
  }
  const unique = [...new Map(links.map((l) => [l.url, l])).values()];

  return { docs, links: unique, count: docs.length + unique.length };
}
