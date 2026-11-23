#!/usr/bin/env node
/**
 * Create a new blog post in one step.
 *
 *   node scripts/new-post.mjs "My post title"
 *   node scripts/new-post.mjs "My post title" --tags kafka,java --excerpt "One-line summary"
 *
 * What it does:
 *   1. creates content/posts/<slug>.md from content/templates/post.md
 *   2. adds an entry to data/posts.json (today's date, "draft": true)
 * Then: write the post, preview it locally, set "draft": false to publish.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_JSON = join(ROOT, "data/posts.json");
const TEMPLATE = join(ROOT, "content/templates/post.md");

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

// ---- parse arguments ----
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const tags = (flag("tags") ?? "")
  .split(",")
  .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
  .filter(Boolean);
const excerpt = flag("excerpt") ?? "";
const customSlug = flag("slug");
const title = args.join(" ").trim();
if (!title) fail('Give the post a title:  node scripts/new-post.mjs "My post title"');

const slug = (customSlug ?? title)
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Could not make a valid slug from "${title}". Pass one with --slug my-post`);

const mdPath = join(ROOT, "content/posts", `${slug}.md`);
const posts = JSON.parse(readFileSync(POSTS_JSON, "utf8"));
if (posts.some((p) => p.slug === slug)) fail(`data/posts.json already has a post with slug "${slug}".`);
if (existsSync(mdPath)) fail(`content/posts/${slug}.md already exists.`);

// ---- today's date (local) ----
const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ---- write the Markdown file (template minus its instruction comment) ----
const body = readFileSync(TEMPLATE, "utf8").replace(/^<!--[\s\S]*?-->\s*/, "");
writeFileSync(mdPath, body);

// ---- add the index entry (newest first) ----
posts.unshift({ slug, title, date, excerpt, tags, draft: true });
writeFileSync(POSTS_JSON, `${JSON.stringify(posts, null, 2)}\n`);

console.log(`
✓ Created content/posts/${slug}.md
✓ Added "${title}" to data/posts.json  (date ${date}, draft: true)

Next:
  1. Write the post in content/posts/${slug}.md
  2. Fill in "excerpt" and "tags" in data/posts.json${excerpt ? " (excerpt already set)" : ""}
  3. Preview:  node scripts/serve.mjs  →  http://localhost:8000/post.html?slug=${slug}
  4. Check:    node scripts/check-content.mjs
  5. Publish:  set "draft": false in data/posts.json, then upload/commit
`);
