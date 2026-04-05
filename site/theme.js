const THEME_KEY = "dogpark-theme";

export function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/** @returns {"light" | "dark"} */
export function getResolvedTheme() {
  return isDarkTheme() ? "dark" : "light";
}

/** @param {"light" | "dark"} theme */
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
}

export function applyThemeFromStorageOrSystem() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }
    if (stored === "light") {
      document.documentElement.removeAttribute("data-theme");
      return;
    }
  } catch {
    /* ignore */
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function syncToggleButton() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const dark = isDarkTheme();
  btn.setAttribute("aria-pressed", dark ? "true" : "false");
  btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  btn.title = dark ? "Light theme" : "Dark theme";
}

/**
 * @param {() => void} onThemeChange
 */
export function initThemeToggle(onThemeChange) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  syncToggleButton();

  btn.addEventListener("click", () => {
    const next = isDarkTheme() ? "light" : "dark";
    applyTheme(next);
    syncToggleButton();
    onThemeChange?.();
  });
}
