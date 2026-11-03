/**
 * Light/dark theme. Default follows the OS; clicking the toggle stores an
 * explicit choice. The inline <script> in each page's <head> applies the stored
 * choice before first paint so there is no flash.
 */

const KEY = "theme";
const root = document.documentElement;
const media = matchMedia("(prefers-color-scheme: dark)");

export const currentTheme = () => root.dataset.theme || (media.matches ? "dark" : "light");

function store(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked (private mode) — theme still applies for this page */
  }
}

function syncButton(button) {
  const next = currentTheme() === "dark" ? "light" : "dark";
  button.setAttribute("aria-label", `Switch to ${next} theme`);
  button.title = `Switch to ${next} theme`;
}

export function initThemeToggle(button) {
  if (!button) return;
  syncButton(button);
  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store(next);
    syncButton(button);
  });
  media.addEventListener("change", () => syncButton(button));
}
