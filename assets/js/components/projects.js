import { html, safeUrl, externalAttrs } from "../core/dom.js";
import { icon } from "../core/icons.js";
import { docHref, workHref } from "../core/library.js";
import { initials } from "../core/format.js";

export const projectHref = (slug) => docHref("project", slug);

/** Where a project card leads: its case study, or the work write-up it belongs to. */
function pageFor(project) {
  if (project.caseStudy) return { href: projectHref(project.slug), label: "Read case study" };
  if (project.workDoc) return { href: workHref(project.workDoc), label: "Read the story" };
  return null;
}

export function ProjectCard(project) {
  const source = safeUrl(project.links?.source);
  const demo = safeUrl(project.links?.demo);
  const page = pageFor(project);
  const cover = safeUrl(project.cover);

  return html`
    <article class="card project-card${page ? " card--interactive" : ""}" id="project-${project.slug}">
      ${cover
        ? html`<div class="project-card__cover"><img src="${cover}" alt="" loading="lazy" decoding="async"></div>`
        : html`<div class="project-card__cover project-card__cover--auto" aria-hidden="true">
            <span>${initials(project.title)}</span>
          </div>`}
      <p class="eyebrow">
        ${project.context}${project.sample ? html` <span class="badge badge--sample">Sample</span>` : ""}
      </p>
      <h3 class="card__title">${page ? html`<a href="${page.href}">${project.title}</a>` : project.title}</h3>
      <p class="card__body">${project.summary}</p>
      ${project.stack?.length
        ? html`<ul class="tag-list" role="list" aria-label="Technologies">
            ${project.stack.map((t) => html`<li class="tag">${t}</li>`)}
          </ul>`
        : ""}
      ${page || source || demo
        ? html`<div class="card__footer">
            ${page ? html`<span class="text-link" aria-hidden="true">${page.label} ${icon("arrowRight")}</span>` : ""}
            ${source ? html`<a class="text-link" href="${source}"${externalAttrs(source)}>${icon("github")} Source</a>` : ""}
            ${demo ? html`<a class="text-link" href="${demo}"${externalAttrs(demo)}>${icon("globe")} Live demo</a>` : ""}
          </div>`
        : ""}
    </article>`;
}

export function Projects({ projects = [] }) {
  if (!projects.length) return null;
  const featured = projects.filter((p) => p.featured);
  const list = featured.length ? featured : projects;

  return {
    id: "projects",
    title: "Selected projects",
    lead: "Things I've built — with write-ups on the problem, the trade-offs and the result.",
    action: html`<a class="text-link" href="blog.html?type=project">All projects ${icon("arrowRight")}</a>`,
    body: html`<div class="project-grid">${list.map(ProjectCard)}</div>`,
  };
}
