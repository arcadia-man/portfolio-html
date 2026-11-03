import { html } from "../core/dom.js";

/**
 * Standard home-page section shell.
 * Section components return a descriptor ({ id, title, lead?, action?, body, bare? })
 * or null when they have nothing to show — the page decides order and styling.
 */
export function Section({ id, title, lead, action, body, bare = false, subtle = false }) {
  return html`
    <section id="${id}" class="section${subtle ? " section--subtle" : ""}" aria-labelledby="${id}-title">
      <div class="container">
        ${bare
          ? ""
          : html`<header class="section__header">
              <div>
                <h2 class="section__title" id="${id}-title">${title}</h2>
                ${lead ? html`<p class="section__lead">${lead}</p>` : ""}
              </div>
              ${action ?? ""}
            </header>`}
        ${body}
      </div>
    </section>`;
}
