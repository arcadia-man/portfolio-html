/**
 * Enhancements for rendered Markdown (article pages):
 *   highlightCode()   syntax highlighting — highlight.js core + only the languages used, loaded lazily
 *   initCodeCopy()    "Copy" buttons on code blocks
 *   initLightbox()    click an image to view it full-size
 *   initProgress()    reading-progress bar under the header
 *   initShare()       copy link / native share / LinkedIn / X
 *   renderDiagrams()  ```mermaid blocks → SVG (Mermaid + ZenUML loaded only when needed)
 */
import { $, $$, esc } from "./dom.js";
import { currentTheme } from "./theme.js";

/* ---------- Syntax highlighting ---------- */

/** Fence label → vendored grammar file in assets/vendor/hljs/languages/. Add more there + here. */
const GRAMMARS = {
  java: "java",
  js: "javascript",
  javascript: "javascript",
  jsx: "javascript",
  ts: "typescript",
  typescript: "typescript",
  tsx: "typescript",
  json: "json",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  sql: "sql",
  yaml: "yaml",
  yml: "yaml",
  python: "python",
  py: "python",
  ruby: "ruby",
  rb: "ruby",
  xml: "xml",
  html: "xml",
  graphql: "graphql",
  gql: "graphql",
  kotlin: "kotlin",
  kt: "kotlin",
  go: "go",
  lua: "lua",
  diff: "diff",
  patch: "diff",
};

export async function highlightCode(root) {
  const blocks = $$('pre code[class*="language-"]', root)
    .map((el) => [el, GRAMMARS[el.className.match(/language-(\S+)/)?.[1]?.toLowerCase()]])
    .filter(([, grammar]) => grammar);
  if (!blocks.length) return;

  try {
    const { default: hljs } = await import("../../vendor/hljs/core.min.js");
    const needed = [...new Set(blocks.map(([, g]) => g))];
    await Promise.all(
      needed.map(async (g) => {
        const { default: grammar } = await import(`../../vendor/hljs/languages/${g}.min.js`);
        hljs.registerLanguage(g, grammar);
      }),
    );
    for (const [el, g] of blocks) {
      el.innerHTML = hljs.highlight(el.textContent, { language: g, ignoreIllegals: true }).value;
      el.classList.add("hljs");
    }
  } catch (err) {
    console.warn("Syntax highlighting unavailable:", err); // code stays readable, just uncoloured
  }
}

/* ---------- Copy code ---------- */

export function initCodeCopy(root) {
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest(".code-block__copy");
    if (!btn) return;
    const code = btn.parentElement.querySelector("code")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Select & copy";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1800);
  });
}

/* ---------- Image lightbox ---------- */

export function initLightbox(root) {
  // Images inside links keep their link behaviour; every other image can be zoomed.
  const images = $$("img", root).filter((img) => !img.closest("a"));
  if (!images.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.innerHTML = `<form method="dialog"><button class="lightbox__close" aria-label="Close image">×</button></form><img alt=""><p class="lightbox__caption"></p>`;
  document.body.append(dialog);
  const big = $("img", dialog);
  const caption = $(".lightbox__caption", dialog);

  images.forEach((img) => {
    img.classList.add("is-zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `View larger: ${img.alt || "image"}`);
    if (NEEDS_MANUAL_ANCHORING && !img.complete) {
      const before = img.getBoundingClientRect().height;
      img.addEventListener(
        "load",
        () => {
          const rect = img.getBoundingClientRect();
          if (rect.top < 0) window.scrollBy(0, rect.height - before);
        },
        { once: true },
      );
    }
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "image-missing";
      fallback.textContent = `Image not found: ${img.alt || img.getAttribute("src")}`;
      img.replaceWith(fallback);
    });
  });

  const open = (img) => {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    caption.textContent = img.closest("figure")?.querySelector("figcaption")?.textContent ?? img.alt;
    dialog.showModal();
  };

  root.addEventListener("click", (e) => {
    const img = e.target.closest("img.is-zoomable");
    if (img) open(img);
  });
  root.addEventListener("keydown", (e) => {
    const img = e.target.closest?.("img.is-zoomable");
    if (img && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(img);
    }
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === big) dialog.close();
  });
}

/* ---------- Reading progress ---------- */

export function initProgress(article) {
  const bar = document.createElement("div");
  bar.className = "reading-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.append(bar);

  let ticking = false;
  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - innerHeight;
    const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    bar.style.transform = `scaleX(${progress})`;
    ticking = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  addEventListener("resize", update, { passive: true });
  update();
}

/* ---------- Share ---------- */

export function initShare(root, { title }) {
  root.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-share]");
    if (!btn) return;
    const url = location.href.replace(/[?&]preview=[^&#]*/, "");
    const label = btn.querySelector("span");

    if (btn.dataset.share === "native" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      label.textContent = "Link copied";
    } catch {
      label.textContent = "Copy from address bar";
    }
    setTimeout(() => (label.textContent = "Copy link"), 1800);
  });

  // Native share sheet exists mostly on phones; hide the button elsewhere.
  if (!navigator.share) $$('[data-share="native"]', root).forEach((b) => (b.hidden = true));
}

/* ---------- Mermaid diagrams ---------- */

const scripts = new Map();

/** Load a vendored classic script once and resolve with the global it defines. */
function loadVendor(file, globalName) {
  if (!scripts.has(file)) {
    scripts.set(
      file,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL(`../../vendor/${file}`, import.meta.url).href;
        script.onload = () => resolve(window[globalName]);
        script.onerror = () => reject(new Error(`Could not load ${file}`));
        document.head.append(script);
      }),
    );
  }
  return scripts.get(file);
}

let diagramSeq = 0;
let zenumlReady;

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Let the browser handle scrolling/input between diagram renders. */
const idle = () =>
  new Promise((resolve) => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 300 }) : setTimeout(resolve, 16)));

/** Browsers without CSS scroll anchoring (Safari) jump when content above the viewport grows. */
const NEEDS_MANUAL_ANCHORING = !(window.CSS && CSS.supports("overflow-anchor", "auto"));

/** Run `change()` and, where the browser won't, keep the visible content still if `el` sits above the viewport. */
export function keepScrollSteady(el, change) {
  const before = el.getBoundingClientRect();
  change();
  if (!NEEDS_MANUAL_ANCHORING || before.top >= 0) return;
  const delta = el.getBoundingClientRect().height - before.height;
  if (delta) window.scrollBy(0, delta);
}

/** Resolve once the tab is visible — hidden pages aren't laid out, so text can't be measured. */
function whenVisible() {
  if (document.visibilityState === "visible") return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onChange);
      resolve();
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

/**
 * Render every ```mermaid block inside `root`.
 * - Mermaid (assets/vendor/mermaid.min.js, ~5.5 MB) starts downloading as soon as a page has a diagram;
 *   the ZenUML plugin (mermaid-zenuml.min.js, ~3.3 MB) only when a ZenUML diagram is about to render.
 * - Placeholders reserve an estimated height; diagrams render one at a time in idle time, nearest the
 *   screen first, until all are done; the page doesn't jump when a diagram above you finishes.
 * - "svg element not in render tree" / measuring errors are retried after fonts + layout settle.
 * - Re-renders with matching colours on `themechange`.
 */
export async function renderDiagrams(root) {
  const blocks = $$("[data-mermaid]", root);
  if (!blocks.length) return;
  const sourceOf = (el) => decodeURIComponent(el.dataset.mermaid);

  // Reserve roughly the final height so the page doesn't jump when the diagram arrives.
  for (const el of blocks) {
    const lines = sourceOf(el).trim().split("\n").length;
    el.style.minHeight = `${Math.min(560, 160 + lines * 16)}px`;
  }

  const showSource = (el, message) =>
    keepScrollSteady(el, () => {
      el.classList.add("is-error");
      el.removeAttribute("aria-busy");
      el.style.minHeight = "";
      el.innerHTML = `<p class="diagram__error">${esc(message)}</p><pre>${esc(sourceOf(el))}</pre>`;
    });

  const mermaidReady = loadVendor("mermaid.min.js", "mermaid");

  async function renderOne(el) {
    const source = sourceOf(el);
    let mermaid;
    try {
      mermaid = await mermaidReady;
      if (/^\s*zenuml\b/.test(source)) {
        zenumlReady ??= loadVendor("mermaid-zenuml.min.js", "mermaid-zenuml").then((zen) =>
          mermaid.registerExternalDiagrams([zen]),
        );
        await zenumlReady;
      }
    } catch (err) {
      showSource(el, err.message);
      return;
    }

    for (let attempt = 1; ; attempt++) {
      await whenVisible();
      await idle();
      // Monochrome to match the site: "neutral" (greys) in light mode, "dark" in dark mode.
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: currentTheme() === "dark" ? "dark" : "neutral",
        fontFamily: getComputedStyle(document.body).fontFamily,
        // Mermaid 12 defaults to the ELK layout engine, which is several times slower; dagre is the classic, fast one.
        layout: "dagre",
      });
      const id = `diagram-${++diagramSeq}`;
      try {
        const { svg } = await mermaid.render(id, source);
        keepScrollSteady(el, () => {
          el.classList.remove("is-error");
          el.removeAttribute("aria-busy");
          el.style.minHeight = "";
          el.innerHTML = svg;
        });
        el.dataset.rendered = "true";
        return;
      } catch (err) {
        document.getElementById(`d${id}`)?.remove(); // Mermaid leaves a temp node behind on errors
        const message = String(err?.message ?? err);
        if (attempt < 3 && /render tree|getBBox|getComputedTextLength/i.test(message)) {
          await document.fonts?.ready;
          await nextFrame();
          await sleep(250 * attempt);
          continue;
        }
        showSource(el, `Diagram error: ${message.split("\n")[0]}`);
        el.dataset.rendered = "true";
        return;
      }
    }
  }

  // Render every diagram, one at a time, always picking the one nearest the screen first.
  // (Waiting for an IntersectionObserver alone misses diagrams skipped by a fast scroll or a TOC jump.)
  const pending = new Set(blocks);
  let working = false;
  const nearScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -1200 && r.top < innerHeight + 1200;
  };
  const pump = async () => {
    if (working) return;
    working = true;
    while (pending.size) {
      const queue = [...pending];
      const next = queue.find(nearScreen) ?? queue[0];
      pending.delete(next);
      await renderOne(next);
    }
    working = false;
  };
  pump();

  // Theme change: redraw what's drawn; anything still pending picks up the new theme anyway.
  document.addEventListener("themechange", () => {
    blocks.filter((el) => el.dataset.rendered).forEach((el) => pending.add(el));
    pump();
  });
}
