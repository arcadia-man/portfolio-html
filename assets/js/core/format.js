/** Date, duration and text helpers. Dates in data files are "YYYY-MM" or "YYYY-MM-DD". */

const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

/** Parse as a local date (new Date("2026-01-05") would be UTC and can shift a day). */
export function parseDate(value) {
  if (!value) return null;
  const [y, m = 1, d = 1] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const formatMonth = (value) => (value ? monthYear.format(parseDate(value)) : "Present");

export const formatDate = (value) => fullDate.format(parseDate(value));

export const formatRange = (start, end) => `${formatMonth(start)} – ${formatMonth(end)}`;

/** Inclusive month count, LinkedIn-style: "1 yr 10 mos". `end` null = today. */
export function duration(start, end) {
  const a = parseDate(start);
  const b = end ? parseDate(end) : new Date();
  const months = Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
  if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
  return parts.join(" ");
}

export function readingTime(text) {
  const words = String(text).trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z0-9#]+;/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const initials = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
