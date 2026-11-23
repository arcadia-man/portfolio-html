#!/usr/bin/env node
/**
 * Content checker — run before you upload or commit:
 *
 *   node scripts/check-content.mjs
 *
 * Errors (exit code 1) = something will be broken on the site.
 * Warnings              = worth a look, but the site still works.
 * It also lists everything still marked "sample" or "draft".
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const pending = [];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;

const rel = (p) => p.replace(`${ROOT}/`, "");
const exists = (p) => existsSync(join(ROOT, p));

function readJSON(name) {
  try {
    return JSON.parse(readFileSync(join(ROOT, "data", `${name}.json`), "utf8"));
  } catch (err) {
    errors.push(`data/${name}.json is not valid JSON — ${err.message}`);
    return null;
  }
}

function readMd(path) {
  try {
    return readFileSync(join(ROOT, path), "utf8");
  } catch {
    return null;
  }
}

const isEmptyMd = (src) => !String(src ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();

/** Every relative ![image](path) in a Markdown file must exist (paths are relative to the .md file). */
function checkImages(mdPath, src) {
  const clean = String(src).replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "");
  for (const m of clean.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)) {
    const href = m[1];
    if (/^([a-z]+:|\/\/|\/|#)/i.test(href)) continue;
    const target = resolve(dirname(join(ROOT, mdPath)), href.split(/[?#]/)[0]);
    if (!existsSync(target)) errors.push(`${mdPath}: image not found → ${href} (looked for ${rel(target)})`);
  }
}

function checkSlug(where, slug, seen) {
  if (!SLUG.test(String(slug ?? ""))) errors.push(`${where}: invalid slug "${slug}" (use lowercase-words-with-dashes)`);
  if (seen.has(slug)) errors.push(`${where}: duplicate slug "${slug}"`);
  seen.add(slug);
}

// ---------- all data files parse ----------
const data = {};
for (const name of ["profile", "experience", "projects", "skills", "education", "achievements", "testimonials", "posts"]) {
  data[name] = readJSON(name);
}

// ---------- posts ----------
if (data.posts) {
  const seen = new Set();
  for (const p of data.posts) {
    const where = `data/posts.json → "${p.slug}"`;
    checkSlug(where, p.slug, seen);
    if (!p.title) errors.push(`${where}: missing "title"`);
    if (!DATE.test(String(p.date ?? ""))) errors.push(`${where}: "date" must be YYYY-MM-DD`);
    if (!p.excerpt) warnings.push(`${where}: empty "excerpt" (shown in lists and search)`);
    for (const t of p.tags ?? []) if (!SLUG.test(t)) warnings.push(`${where}: tag "${t}" should be lowercase-kebab-case`);
    const md = `content/posts/${p.slug}.md`;
    const src = readMd(md);
    if (src === null) errors.push(`${where}: file ${md} is missing`);
    else {
      checkImages(md, src);
      if (isEmptyMd(src) && !p.draft) errors.push(`${where}: published but ${md} is empty`);
    }
    if (p.sample) pending.push(`sample post: ${p.slug}`);
    else if (p.draft) pending.push(`draft post: ${p.slug}`);
  }
  for (const f of readdirSync(join(ROOT, "content/posts")).filter((f) => f.endsWith(".md"))) {
    if (!data.posts.some((p) => `${p.slug}.md` === f)) warnings.push(`content/posts/${f} has no entry in data/posts.json (it won't appear)`);
  }
}

// ---------- experience → work write-ups ----------
const workSlugs = new Set();
if (data.experience) {
  for (const company of data.experience) {
    for (const role of company.roles ?? []) {
      if (!DATE.test(String(role.start ?? ""))) errors.push(`data/experience.json → ${company.company} / ${role.title}: "start" must be YYYY-MM`);
      if (role.end !== null && !DATE.test(String(role.end ?? ""))) errors.push(`data/experience.json → ${company.company} / ${role.title}: "end" must be YYYY-MM or null`);
      for (const h of role.highlights ?? []) {
        if (!h.slug) continue;
        const where = `data/experience.json → "${h.slug}"`;
        checkSlug(where, h.slug, workSlugs);
        if (!h.title) errors.push(`${where}: missing "title"`);
        const md = `content/work/${h.slug}.md`;
        const src = readMd(md);
        if (src === null) warnings.push(`${where}: ${md} missing (page shows "write-up in progress")`);
        else {
          checkImages(md, src);
          if (!h.draft && isEmptyMd(src)) warnings.push(`${where}: "draft": false but ${md} has no content yet`);
        }
        if (h.draft) pending.push(`draft work write-up: ${h.slug}`);
      }
    }
  }
  for (const f of readdirSync(join(ROOT, "content/work")).filter((f) => f.endsWith(".md"))) {
    if (!workSlugs.has(f.replace(/\.md$/, ""))) warnings.push(`content/work/${f} has no matching highlight slug in data/experience.json`);
  }
}

// ---------- projects ----------
if (data.projects) {
  const seen = new Set();
  for (const p of data.projects) {
    const where = `data/projects.json → "${p.slug}"`;
    checkSlug(where, p.slug, seen);
    if (p.caseStudy) {
      const md = `content/projects/${p.slug}.md`;
      const src = readMd(md);
      if (src === null) errors.push(`${where}: "caseStudy": true but ${md} is missing`);
      else checkImages(md, src);
    }
    if (p.workDoc && !workSlugs.has(p.workDoc)) errors.push(`${where}: "workDoc" "${p.workDoc}" is not a highlight slug in data/experience.json`);
    if (p.cover && !/^https?:/.test(p.cover) && !exists(p.cover)) errors.push(`${where}: cover image not found → ${p.cover}`);
    if (p.sample) pending.push(`sample project: ${p.slug}`);
  }
}

// ---------- skills ----------
if (data.skills) {
  for (const g of data.skills) {
    for (const s of g.items ?? []) {
      for (const proof of s.proof ?? []) {
        if (!proof.url) errors.push(`data/skills.json → ${s.name}: proof "${proof.label}" has no url`);
        if (proof.sample) pending.push(`sample skill proof: ${s.name} → ${proof.label}`);
      }
    }
  }
}

// ---------- profile & testimonials ----------
if (data.profile) {
  const photo = data.profile.photo?.src;
  if (photo && !/^https?:/.test(photo) && !exists(photo)) errors.push(`data/profile.json: photo not found → ${photo}`);
  if (data.profile.resume && !exists(data.profile.resume)) errors.push(`data/profile.json: résumé not found → ${data.profile.resume}`);
  for (const s of data.profile.socials ?? []) if (s.sample) pending.push(`sample social link: ${s.label}`);
}
for (const t of data.testimonials ?? []) if (t.sample) pending.push(`sample testimonial: ${t.name}`);

// ---------- report ----------
const section = (title, items, mark) => items.length && console.log(`\n${title} (${items.length})\n${items.map((i) => `  ${mark} ${i}`).join("\n")}`);
section("Errors — fix these", errors, "✗");
section("Warnings", warnings, "!");
section("Not live yet (sample / draft — hidden on the live site)", pending, "·");
console.log(errors.length ? `\n✗ ${errors.length} error(s).\n` : "\n✓ No errors.\n");
process.exit(errors.length ? 1 : 0);
