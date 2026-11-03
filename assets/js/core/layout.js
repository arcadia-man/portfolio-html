/**
 * Shared page chrome: header (desktop nav + mobile menu), footer, preview-mode
 * bar, and the error screen. Every page calls mountLayout() once.
 */
import { html, mount, safeUrl, externalAttrs, $, $$ } from "./dom.js";
import { icon } from "./icons.js";
import { initials } from "./format.js";
import { initThemeToggle } from "./theme.js";
import { isPreview, isLocal, visible } from "./data.js";

/** Primary navigation. `section` = id on the home page; `href` = a separate page. */
const NAV = [
  { label: "About", section: "about" },
  { label: "Experience", section: "experience" },
  { label: "Projects", section: "projects" },
  { label: "Skills", section: "skills" },
  { label: "Blog", href: "blog.html", key: "blog" },
  { label: "Contact", section: "contact" },
];

/**
 * @param {object} opts
 * @param {"home"|"blog"|"post"|"work"|"project"} opts.page
 * @param {object} opts.profile  data/profile.json
 */
export function mountLayout({ page, profile }) {
  const isHome = page === "home";
  const items = NAV;
  const hrefFor = (item) => item.href ?? (isHome ? `#${item.section}` : `index.html#${item.section}`);
  const isCurrent = (item) =>
    (item.key === "blog" && (page === "blog" || page === "post")) ||
    (item.section === "projects" && page === "project") ||
    (item.section === "experience" && page === "work");

  const links = items.map(
    (item) => html`<li><a href="${hrefFor(item)}" data-section="${item.section ?? ""}"${
      isCurrent(item) ? html` aria-current="page"` : ""
    }>${item.label}</a></li>`,
  );

  const header = $("#site-header");
  mount(
    header,
    html`
      <div class="container site-header__inner">
        <a class="brand" href="${isHome ? "#top" : "index.html"}" aria-label="${profile.name} — home">
          <span class="brand__mark" aria-hidden="true">${initials(profile.name)}</span>
          <span class="brand__name">${profile.name}</span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <ul class="site-nav__list" role="list">${links}</ul>
        </nav>
        <div class="site-header__actions">
          <button class="icon-btn theme-toggle" type="button" id="theme-toggle">
            ${icon("moon", "icon-moon")}${icon("sun", "icon-sun")}
          </button>
          <a class="btn btn--secondary btn--sm site-header__resume" href="${profile.resume}" target="_blank" rel="noopener">
            ${icon("download")} Résumé
          </a>
          <button class="icon-btn menu-toggle" type="button" id="menu-toggle"
            aria-controls="mobile-nav" aria-expanded="false" aria-label="Open menu">
            ${icon("menu", "icon-menu")}${icon("close", "icon-close")}
          </button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile" hidden>
        <div class="container">
          <ul class="mobile-nav__list" role="list">${links}</ul>
          <div class="mobile-nav__footer">
            <a class="btn btn--primary" href="${profile.resume}" target="_blank" rel="noopener">${icon("download")} Download résumé</a>
          </div>
        </div>
      </nav>`,
  );

  mountFooter(profile);
  mountPreviewBar();

  initThemeToggle($("#theme-toggle"));
  initMobileMenu(header);
  initScrollState(header);
  if (isHome) initScrollSpy();
}

function mountFooter(profile) {
  const socials = visible(profile.socials)
    .map((s) => ({ ...s, url: safeUrl(s.url) }))
    .filter((s) => s.url);

  mount(
    "#site-footer",
    html`
      <div class="container site-footer__inner">
        <p>© ${new Date().getFullYear()} ${profile.name}</p>
        <div class="site-footer__end">
          <ul class="social-list" role="list">
            ${socials.map(
              (s) => html`<li><a class="icon-btn" href="${s.url}" aria-label="${s.label}"${externalAttrs(s.url)}>${icon(s.icon)}</a></li>`,
            )}
          </ul>
          <a class="back-to-top" href="#main">${icon("arrowUp")} Back to top</a>
        </div>
      </div>`,
  );
}

/**
 * Thin bar at the very top that says whether drafts/samples are visible.
 * Shown whenever preview is on, and always when running locally (to toggle it).
 */
function mountPreviewBar() {
  const preview = isPreview();
  if (!preview && !isLocal) return;
  const bar = document.createElement("div");
  bar.className = "preview-bar";
  bar.innerHTML = String(
    preview
      ? html`<strong>Preview mode</strong> — drafts and sample content are visible. Visitors to the live site won't see them.
          <a href="?preview=0">See live view</a>`
      : html`<strong>Live view</strong> — showing only published content. <a href="?preview=1">Show drafts &amp; samples</a>`,
  );
  document.body.prepend(bar);
}

function initMobileMenu(header) {
  const toggle = $("#menu-toggle", header);
  const panel = $("#mobile-nav", header);
  if (!toggle || !panel) return;

  const setOpen = (open, { focusToggle = false } = {}) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.hidden = !open;
    header.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("a", panel)?.focus();
    else if (focusToggle) toggle.focus();
  };

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) setOpen(false, { focusToggle: true });
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !header.contains(e.target)) setOpen(false);
  });
  matchMedia("(min-width: 960px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}

function initScrollState(header) {
  let ticking = false;
  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

/** Highlight the nav link for the section currently crossing the middle of the viewport. */
function initScrollSpy() {
  const links = $$('#site-header a[data-section]:not([data-section=""])');
  const sections = [...new Set(links.map((a) => a.dataset.section))]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.dataset.section === entry.target.id) a.setAttribute("aria-current", "true");
          else if (a.getAttribute("aria-current") === "true") a.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  sections.forEach((s) => observer.observe(s));
}

/** Friendly failure screen — most often: page opened via file:// instead of a server. */
export function renderFatal(error) {
  console.error(error);
  const isFile = location.protocol === "file:";
  mount(
    "#main",
    html`
      <div class="container" style="padding-block: var(--section-y)">
        <div class="empty-state">
          <h1>Something went wrong loading this page.</h1>
          ${isFile
            ? html`<p>This site loads its content from JSON files, which browsers block on <code>file://</code>.
                Start a local server in the project folder — <code>python3 -m http.server 8000</code> — then open
                <a class="text-link" href="http://localhost:8000">localhost:8000</a>.</p>`
            : html`<p>Please refresh the page. If it keeps happening, the content files may be missing.</p>`}
        </div>
      </div>`,
  );
}
