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

export function syncThemeSegmentButtons() {
  const light = document.getElementById("theme-light");
  const dark = document.getElementById("theme-dark");
  if (!light || !dark) return;
  const isDark = isDarkTheme();
  light.setAttribute("aria-pressed", String(!isDark));
  dark.setAttribute("aria-pressed", String(isDark));
  light.classList.toggle("pref-btn--active", !isDark);
  dark.classList.toggle("pref-btn--active", isDark);
}

/**
 * @param {() => void} onThemeChange
 */
export function initThemeSegment(onThemeChange) {
  const light = document.getElementById("theme-light");
  const dark = document.getElementById("theme-dark");
  if (!light || !dark) return;

  syncThemeSegmentButtons();

  light.addEventListener("click", () => {
    applyTheme("light");
    syncThemeSegmentButtons();
    onThemeChange?.();
  });
  dark.addEventListener("click", () => {
    applyTheme("dark");
    syncThemeSegmentButtons();
    onThemeChange?.();
  });
}
