import { html, inline, safeUrl, externalAttrs } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { formatMonth, duration } from "../core/format.js";
import { workHref } from "../core/library.js";

const monogram = (name) => (String(name).match(/[A-Za-z0-9]/)?.[0] ?? "?").toUpperCase();

/** One bullet. With a slug it links to its write-up page (work.html?slug=…). */
function Highlight(h) {
  if (!h.slug) return html`<li>${inline(h.text)}</li>`;
  return html`
    <li>
      <a class="highlight" href="${workHref(h.slug)}">
        <span class="highlight__text">${inline(h.text)}</span>
        <span class="highlight__cta">Read more ${icon("arrowRight")}</span>
      </a>
    </li>`;
}

function Role(role) {
  const highlights = role.highlights ?? [];
  return html`
    <li class="role${role.end ? "" : " is-current"}">
      <div class="role__header">
        <h4 class="role__title">${role.title}</h4>
        <p class="role__period">
          <time datetime="${role.start}">${formatMonth(role.start)}</time> –
          ${role.end ? html`<time datetime="${role.end}">${formatMonth(role.end)}</time>` : "Present"}
          · ${duration(role.start, role.end)}
        </p>
      </div>
      ${role.summary ? html`<p class="role__summary">${role.summary}</p>` : ""}
      ${highlights.length ? html`<ul class="role__highlights">${highlights.map(Highlight)}</ul>` : ""}
      ${role.stack?.length
        ? html`<ul class="tag-list" role="list" aria-label="Technologies">
            ${role.stack.map((t) => html`<li class="tag">${t}</li>`)}
          </ul>`
        : ""}
    </li>`;
}

function Company(company) {
  const roles = company.roles ?? [];
  const start = roles.map((r) => r.start).sort()[0];
  const end = roles.some((r) => !r.end) ? null : roles.map((r) => r.end).sort().at(-1);
  const url = safeUrl(company.url);
  const logo = safeUrl(company.logo);
  const name = url ? html`<a href="${url}"${externalAttrs(url)}>${company.company}</a>` : company.company;

  return html`
    <article class="company">
      <header class="company__header">
        <span class="company__logo" aria-hidden="true">
          ${logo ? html`<img src="${logo}" alt="" width="44" height="44" loading="lazy">` : monogram(company.company)}
        </span>
        <div>
          <h3 class="company__name">${name}</h3>
          <p class="company__meta">${[company.location, start && duration(start, end)].filter(Boolean).join(" · ")}</p>
        </div>
      </header>
      <ol class="roles" role="list">${roles.map(Role)}</ol>
    </article>`;
}

export function Experience({ experience = [] }) {
  if (!experience.length) return null;
  return {
    id: "experience",
    title: "Experience",
    lead: "Where I've worked and what I shipped. Click any item for the full story behind it.",
    body: html`<div class="companies">${experience.map(Company)}</div>`,
  };
}
