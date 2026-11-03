import { html } from "../core/dom.js";
import { skillList, skillEvidence } from "../core/library.js";

export const skillHref = (slug) => `blog.html?skill=${encodeURIComponent(slug)}`;

/**
 * Every skill links to the Blog page filtered to that skill, which shows its
 * proof: links from data/skills.json → "proof", project source/demo links, and
 * every write-up that mentions it. The small number = how much evidence exists.
 */
export function Skills({ skills = [], library = [], projects = [] }) {
  if (!skills.length) return null;
  const all = skillList(skills);
  const byGroup = Map.groupBy ? Map.groupBy(all, (s) => s.group) : groupBy(all);

  return {
    id: "skills",
    title: "Skills & tools",
    lead: "Click any skill to see proof — code, live demos and write-ups where I've used it.",
    body: html`
      <dl class="skills">
        ${[...byGroup].map(
          ([group, items]) => html`<div class="skills__row">
            <dt class="skills__group">${group}</dt>
            <dd>
              <ul class="tag-list" role="list">
                ${items.map((s) => {
                  const { count } = skillEvidence(s, { library, projects });
                  return html`<li>
                    <a class="tag tag--link" href="${skillHref(s.slug)}"
                      aria-label="${s.name}${count ? ` — ${count} item${count > 1 ? "s" : ""} of proof` : ""}">
                      ${s.name}${count ? html`<span class="tag__count" aria-hidden="true">${count}</span>` : ""}
                    </a>
                  </li>`;
                })}
              </ul>
            </dd>
          </div>`,
        )}
      </dl>`,
  };
}

function groupBy(items) {
  const map = new Map();
  items.forEach((s) => map.set(s.group, [...(map.get(s.group) ?? []), s]));
  return map;
}
