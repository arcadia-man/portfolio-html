import { html, inline, safeUrl, externalAttrs } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { initials } from "../core/format.js";
import { visible } from "../core/data.js";

export function Hero({ profile, current }) {
  const photoSrc = safeUrl(profile.photo?.src);
  const socials = visible(profile.socials).map((s) => ({ ...s, url: safeUrl(s.url) })).filter((s) => s.url);
  const role = current ? html`${current.title} at <strong>${current.company}</strong>` : profile.title;

  return html`
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="container">
        <div class="hero__grid">
          <div class="hero__content">
            <p class="eyebrow hero__status">${icon("mapPin")}<span>${profile.location}</span></p>
            <h1 class="hero__title" id="hero-title">${profile.name}</h1>
            <p class="hero__role">${role}</p>
            <p class="hero__lead">${inline(profile.headline)}</p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#experience">See my work ${icon("arrowRight")}</a>
              <a class="btn btn--secondary" href="${profile.resume}" target="_blank" rel="noopener">${icon("download")} Résumé</a>
              ${socials.length
                ? html`<ul class="social-list hero__socials" role="list">
                    ${socials.map(
                      (s) => html`<li><a class="icon-btn" href="${s.url}" aria-label="${s.label}"${externalAttrs(s.url)}>${icon(s.icon)}</a></li>`,
                    )}
                  </ul>`
                : ""}
            </div>
          </div>
          <div class="hero__media">
            <div class="hero__photo" data-initials="${initials(profile.name)}">
              ${photoSrc
                ? html`<img src="${photoSrc}" alt="${profile.photo.alt ?? profile.name}" width="640" height="800"
                    fetchpriority="high" decoding="async" referrerpolicy="no-referrer">`
                : html`<span class="hero__photo-fallback" aria-hidden="true">${initials(profile.name)}</span>`}
            </div>
          </div>
        </div>
        ${profile.metrics?.length
          ? html`<dl class="metrics">
              ${profile.metrics.map(
                (m) => html`<div class="metric"><dt class="metric__label">${m.label}</dt><dd class="metric__value">${m.value}</dd></div>`,
              )}
            </dl>`
          : ""}
      </div>
    </section>`;
}

/** Swap a broken/blocked photo for initials. Call after the hero is in the DOM. */
export function initHeroPhoto(root = document) {
  const wrap = root.querySelector(".hero__photo");
  const img = wrap?.querySelector("img");
  if (!img) return;
  const fallback = () => {
    wrap.innerHTML = `<span class="hero__photo-fallback" aria-hidden="true">${wrap.dataset.initials}</span>`;
  };
  img.addEventListener("error", fallback, { once: true });
  if (img.complete && img.naturalWidth === 0) fallback();
}
