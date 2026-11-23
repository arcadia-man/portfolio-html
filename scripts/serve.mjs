#!/usr/bin/env node
/**
 * Local dev server — like `python3 -m http.server`, but tells the browser never to cache,
 * so you always see your latest edits (Safari in particular caches aggressively).
 * Unknown URLs get 404.html, the same as on Netlify.
 *
 *   node scripts/serve.mjs          → http://localhost:8000
 *   node scripts/serve.mjs 3000     → http://localhost:3000
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const path = normalize(join(ROOT, decoded));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) return null; // no escaping the project folder
  try {
    const info = await stat(path);
    return info.isDirectory() ? join(path, "index.html") : path;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const headers = { "Cache-Control": "no-store" };
  let file = await resolveFile(req.url);
  let status = 200;
  let body;
  try {
    body = await readFile(file);
  } catch {
    status = 404;
    file = join(ROOT, "404.html");
    body = await readFile(file).catch(() => Buffer.from("Not found"));
  }
  res.writeHead(status, { ...headers, "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" });
  res.end(body);
}).listen(PORT, () => console.log(`Serving ${ROOT}\n→ http://localhost:${PORT}  (no caching — reload shows your latest edits; Ctrl+C to stop)`));
