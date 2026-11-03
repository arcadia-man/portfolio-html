import { html, inline } from "../core/dom.js";
import { formatRange } from "../core/format.js";

export function About({ profile, achievements = [], education = [] }) {
  if (!profile.bio?.length) return null;

  return {
    id: "about",
    title: "About",
    body: html`
      <div class="about">
        <div class="about__bio">
          ${profile.bio.map((p) => html`<p>${inline(p)}</p>`)}
        </div>
        <aside class="about__aside" aria-label="Highlights">
          ${achievements.length
            ? html`<div class="aside-card">
                <h3 class="eyebrow aside-card__title">Recognition</h3>
                <ul class="aside-list" role="list">
                  ${achievements.map((a) => html`<li><strong>${a.title}</strong><span>${a.detail}</span></li>`)}
                </ul>
              </div>`
            : ""}
          ${education.length
            ? html`<div class="aside-card">
                <h3 class="eyebrow aside-card__title">Education</h3>
                <ul class="aside-list" role="list">
                  ${education.map(
                    (e) => html`<li>
                      <strong>${e.degree}</strong>
                      <span>${e.school}</span>
                      <span class="mono">${formatRange(e.start, e.end)}${e.detail ? ` · ${e.detail}` : ""}</span>
                    </li>`,
                  )}
                </ul>
              </div>`
            : ""}
        </aside>
      </div>`,
  };
}
