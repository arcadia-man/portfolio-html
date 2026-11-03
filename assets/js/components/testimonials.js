import { html, safeUrl, externalAttrs } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { initials } from "../core/format.js";
import { visible } from "../core/data.js";

/**
 * "Appreciation" — quotes from colleagues (data/testimonials.json).
 * Fields: quote, name, role, company, relationship?, photo?, url? (e.g. the LinkedIn
 * recommendation), sample? (sample entries only show in preview mode).
 */
function Testimonial(t) {
  const url = safeUrl(t.url);
  const photo = safeUrl(t.photo);
  const roleLine = [t.role, t.company].filter(Boolean).join(", ");

  return html`
    <figure class="testimonial">
      <div class="testimonial__top">
        ${icon("quote", "testimonial__mark")}
        ${t.sample ? html`<span class="badge badge--sample">Sample</span>` : ""}
      </div>
      <blockquote class="testimonial__quote"><p>${t.quote}</p></blockquote>
      <figcaption class="testimonial__author">
        <span class="avatar" aria-hidden="true">
          ${photo ? html`<img src="${photo}" alt="" width="44" height="44" loading="lazy">` : initials(t.name)}
        </span>
        <span class="testimonial__who">
          <strong>${t.name}</strong>
          ${roleLine ? html`<span>${roleLine}</span>` : ""}
          ${t.relationship ? html`<span class="testimonial__rel">${t.relationship}</span>` : ""}
        </span>
        ${url
          ? html`<a class="icon-btn testimonial__link" href="${url}"${externalAttrs(url)} aria-label="View original recommendation">${icon("linkedin")}</a>`
          : ""}
      </figcaption>
    </figure>`;
}

export function Testimonials({ testimonials = [] }) {
  const list = visible(testimonials);
  if (!list.length) return null;

  return {
    id: "appreciation",
    title: "Appreciation",
    lead: "What managers and teammates say about working with me.",
    body: html`<div class="testimonials">${list.map(Testimonial)}</div>`,
  };
}
