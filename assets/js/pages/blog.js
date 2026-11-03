/**
 * Blog: every document on the site (articles, work write-ups, case studies) with
 * search, type tabs, tag filters, skill-proof view and pagination.
 * All state lives in the URL so any view is linkable and survives reload:
 *   blog.html?q=kafka&type=work&tag=debugging&skill=kafka&page=2
 */
import { html, mount, $, $$, debounce, safeUrl, externalAttrs } from "../core/dom.js";
import { icon, PROOF_ICONS } from "../core/icons.js";
import { loadAll, visible, tagCounts } from "../core/data.js";
import { buildLibrary, typeCounts, DOC_TYPES, skillList, skillEvidence } from "../core/library.js";
import { mountLayout, renderFatal } from "../core/layout.js";
import { searchDocs } from "../core/search.js";
import { DocItem } from "../components/posts.js";

const PAGE_SIZE = 10;
const VISIBLE_TAGS = 12;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function readState() {
  const p = new URLSearchParams(location.search);
  return {
    query: p.get("q") ?? "",
    tag: p.get("tag") ?? "",
    type: DOC_TYPES[p.get("type")] ? p.get("type") : "",
    skill: p.get("skill") ?? "",
    page: Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1),
  };
}

function writeState(state) {
  const p = new URLSearchParams(location.search);
  const set = (k, v) => (v ? p.set(k, v) : p.delete(k));
  set("q", state.query.trim());
  set("type", state.type);
  set("tag", state.tag);
  set("skill", state.skill);
  set("page", state.page > 1 ? String(state.page) : "");
  p.delete("preview"); // preview choice is remembered per tab; keep URLs clean
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/* ---------- Static shell ---------- */

function Shell({ types, tags, total }) {
  return html`
    <section class="container page-header" aria-labelledby="blog-title">
      <h1 class="page-header__title" id="blog-title">Blog</h1>
      <p class="section__lead">Articles, deep dives into the work behind my résumé, and project case studies.</p>
    </section>
    <section class="container blog" aria-label="Posts">
      <div id="skill-panel"></div>
      <div class="blog__controls">
        <form class="search" role="search" id="search-form">
          ${icon("search")}
          <label class="visually-hidden" for="search">Search posts</label>
          <input id="search" type="search" placeholder="Search ${total} posts" autocomplete="off" spellcheck="false">
          <kbd aria-hidden="true">/</kbd>
          <button class="search__clear" type="button" id="search-clear" aria-label="Clear search">${icon("close")}</button>
        </form>
        ${types.length > 1
          ? html`<div class="type-tabs" role="group" aria-label="Filter by type">
              <button type="button" class="type-tab" data-type="" aria-pressed="false">All <span>${total}</span></button>
              ${types.map(
                ([type, n]) => html`<button type="button" class="type-tab" data-type="${type}" aria-pressed="false">
                  ${DOC_TYPES[type].plural} <span>${n}</span>
                </button>`,
              )}
            </div>`
          : ""}
        ${tags.length
          ? html`<div class="filters" id="tag-filters" role="group" aria-label="Filter by tag">
              ${tags.map(
                ([tag, n], i) => html`<button class="filter${i >= VISIBLE_TAGS ? " filter--extra" : ""}" type="button"
                  data-tag="${tag}" aria-pressed="false">#${tag} <span class="filter__count">${n}</span></button>`,
              )}
              ${tags.length > VISIBLE_TAGS
                ? html`<button class="filter filter--more" type="button" id="tags-more" aria-expanded="false">
                    +${tags.length - VISIBLE_TAGS} more</button>`
                : ""}
            </div>`
          : ""}
      </div>
      <p class="blog__status" id="blog-status" aria-live="polite"></p>
      <ol class="post-list" id="post-list" role="list"></ol>
      <nav class="pagination" id="pagination" aria-label="Pagination"></nav>
    </section>`;
}

/* ---------- Skill proof panel ---------- */

function hostOf(url) {
  try {
    return new URL(url, location.href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function SkillPanel(skill, evidence) {
  return html`
    <section class="skill-panel" aria-labelledby="skill-title">
      <div class="skill-panel__head">
        <div>
          <p class="eyebrow">Skill · ${skill.group}</p>
          <h2 class="skill-panel__title" id="skill-title">${skill.name}</h2>
        </div>
        <button class="btn btn--secondary btn--sm" type="button" id="clear-skill">${icon("close")} Clear</button>
      </div>
      <p class="skill-panel__lead">
        Proof of work for <strong>${skill.short}</strong> — code, live demos, certificates and write-ups.
      </p>
      ${evidence.links.length
        ? html`<ul class="proof-list" role="list">
            ${evidence.links.map((l) => {
              const url = safeUrl(l.url);
              return html`<li>
                <a class="proof" href="${url}"${externalAttrs(url)}>
                  <span class="proof__icon">${icon(PROOF_ICONS[l.type] ?? "link")}</span>
                  <span class="proof__text">
                    <strong>${l.label}</strong>
                    <span>${hostOf(url)}${l.sample ? html` · <span class="badge badge--sample">Sample</span>` : ""}</span>
                  </span>
                  ${icon("arrowUpRight", "proof__arrow")}
                </a>
              </li>`;
            })}
          </ul>`
        : ""}
      ${!evidence.count
        ? html`<p class="skill-panel__empty">Write-ups and public links for ${skill.short} are on the way.</p>`
        : ""}
    </section>`;
}

/* ---------- Dynamic parts ---------- */

function Pagination(page, pages) {
  if (pages <= 1) return "";
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) items.push(html`<span aria-hidden="true">…</span>`);
    items.push(
      html`<button type="button" data-page="${n}" aria-label="Page ${n}"${n === page ? html` aria-current="page"` : ""}>${n}</button>`,
    );
  });
  return html`
    <button type="button" data-page="${page - 1}" aria-label="Previous page"${page === 1 ? html` disabled` : ""}>${icon("arrowLeft")}</button>
    ${items}
    <button type="button" data-page="${page + 1}" aria-label="Next page"${page === pages ? html` disabled` : ""}>${icon("arrowRight")}</button>`;
}

function EmptyState({ hasDocs, filtered }) {
  if (!hasDocs) return html`<li class="empty-state"><h2>First posts are on the way.</h2><p>Check back soon.</p></li>`;
  if (!filtered) return "";
  return html`<li class="empty-state"><h2>Nothing matches that.</h2><p>Try a different search term, type or tag.</p>
    <button class="btn btn--secondary" type="button" id="reset-filters">Clear all filters</button></li>`;
}

/* ---------- Page ---------- */

async function main() {
  const data = await loadAll("profile", "posts", "experience", "projects", "skills");
  const projects = visible(data.projects);
  const docs = buildLibrary({ ...data, projects });
  const skills = skillList(data.skills);
  mountLayout({ page: "blog", profile: data.profile });

  mount("#main", Shell({ types: typeCounts(docs), tags: tagCounts(docs), total: docs.length }));

  const input = $("#search");
  const list = $("#post-list");
  const status = $("#blog-status");
  const pager = $("#pagination");
  const controls = $(".blog__controls");
  let state = readState();
  input.value = state.query;

  function render({ scroll = false } = {}) {
    const skill = skills.find((s) => s.slug === state.skill);
    if (!skill) state.skill = "";
    const evidence = skill ? skillEvidence(skill, { library: docs, projects }) : null;

    mount("#skill-panel", skill ? SkillPanel(skill, evidence) : "");
    document.title = `${skill ? `${skill.short} — ` : ""}Blog — ${data.profile.name}`;

    const { results, tokens } = searchDocs(docs, {
      ...state,
      within: evidence ? new Set(evidence.docs) : undefined,
    });
    const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    const slice = results.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    const filtered = Boolean(state.query || state.tag || state.type || state.skill);
    // Skill view with no write-ups: the panel already explains it — no extra empty state.
    const skillOnly = skill && !state.query && !state.tag && !state.type;

    mount(
      list,
      slice.length
        ? slice.map((d) => DocItem(d, { level: 2, tokens }))
        : EmptyState({ hasDocs: docs.length > 0, filtered: filtered && !skillOnly }),
    );
    mount(pager, Pagination(state.page, pages));

    status.textContent = skill
      ? `${plural(results.length, "write-up")} mentioning ${skill.short}`
      : filtered
        ? `${results.length} of ${plural(docs.length, "post")}`
        : plural(docs.length, "post");

    $$(".type-tab").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === state.type)));
    $$(".filter[data-tag]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.tag === state.tag));
      if (b.dataset.tag === state.tag) b.classList.add("is-shown");
    });
    writeState(state);

    if (scroll) {
      const top = list.getBoundingClientRect().top + scrollY - controls.offsetHeight - 80;
      if (scrollY > top) scrollTo({ top, behavior: "smooth" });
    }
  }

  const update = (patch, opts) => {
    state = { ...state, ...patch };
    render(opts);
  };
  const resetAll = () => {
    input.value = "";
    update({ query: "", tag: "", type: "", skill: "", page: 1 });
  };

  input.addEventListener("input", debounce(() => update({ query: input.value, page: 1 }), 120));
  $("#search-form").addEventListener("submit", (e) => e.preventDefault());
  $("#search-clear").addEventListener("click", () => {
    input.value = "";
    update({ query: "", page: 1 });
    input.focus();
  });

  document.addEventListener("click", (e) => {
    const typeTab = e.target.closest(".type-tab");
    if (typeTab) return update({ type: typeTab.dataset.type, page: 1 });

    const filter = e.target.closest(".filter[data-tag]");
    if (filter) return update({ tag: filter.dataset.tag === state.tag ? "" : filter.dataset.tag, page: 1 });

    const more = e.target.closest("#tags-more");
    if (more) {
      const open = more.getAttribute("aria-expanded") !== "true";
      $("#tag-filters").classList.toggle("is-expanded", open);
      more.setAttribute("aria-expanded", String(open));
      more.textContent = open ? "Fewer tags" : `+${$$(".filter--extra").length} more`;
      return;
    }

    const tagLink = e.target.closest("#post-list a.tag");
    if (tagLink) {
      e.preventDefault();
      return update({ tag: tagLink.dataset.tag, page: 1 }, { scroll: true });
    }

    const pageBtn = e.target.closest("#pagination button[data-page]");
    if (pageBtn && !pageBtn.disabled) return update({ page: Number(pageBtn.dataset.page) }, { scroll: true });

    if (e.target.closest("#clear-skill")) return update({ skill: "", page: 1 });
    if (e.target.closest("#reset-filters")) resetAll();
  });

  // "/" focuses search; Escape clears it.
  document.addEventListener("keydown", (e) => {
    const el = document.activeElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName) || el?.isContentEditable;
    if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === "Escape" && el === input && input.value) {
      input.value = "";
      update({ query: "", page: 1 });
    }
  });

  render();
}

main().catch(renderFatal);
