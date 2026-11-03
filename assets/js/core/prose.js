/**
 * Enhancements for rendered Markdown (article pages):
 *   highlightCode()   syntax highlighting — highlight.js core + only the languages used, loaded lazily
 *   initCodeCopy()    "Copy" buttons on code blocks
 *   initLightbox()    click an image to view it full-size
 *   initProgress()    reading-progress bar under the header
 *   initShare()       copy link / native share / LinkedIn / X
 */
import { $, $$ } from "./dom.js";

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
  const images = $$("img", root);
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
