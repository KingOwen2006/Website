export const themes = ["dark", "light", "auto"] as const;
export const accents = ["blue", "coral", "mint", "lilac", "mono", "red", "white"] as const;
const storageKey = "portfolio-preferences";
const systemTheme = matchMedia("(prefers-color-scheme: light)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;

type Preferences = {
  theme: typeof themes[number];
  accent: typeof accents[number];
};

export function readPreferences(): Preferences {
  let saved: Partial<Preferences> | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
  } catch {
    // Storage can be unavailable in a private browser context.
  }
  return {
    theme: saved?.theme && themes.includes(saved.theme) ? saved.theme : "dark",
    accent: saved?.accent && accents.includes(saved.accent) ? saved.accent : "blue",
  };
}

function resolvedTheme(theme: Preferences["theme"]) {
  return theme === "auto" ? (systemTheme.matches ? "light" : "dark") : theme;
}

function applyPreferences(preferences: Preferences) {
  const theme = resolvedTheme(preferences.theme);
  root.dataset.theme = theme;
  root.dataset.accent = preferences.accent;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f3f5f8" : "#050505");
}

let current = readPreferences();
let appearanceTransition: ViewTransition | undefined;
applyPreferences(current);

function updateAppearance(animate = false) {
  appearanceTransition?.skipTransition();
  const changed = root.dataset.theme !== resolvedTheme(current.theme) || root.dataset.accent !== current.accent;
  if (!animate || !changed || document.hidden ||
      reducedMotion.matches || !document.startViewTransition) {
    applyPreferences(current);
    return;
  }

  // Capture the sidebar in the same snapshot so its colours fade with the page.
  root.classList.add("appearance-changing");
  const transition = document.startViewTransition(() => applyPreferences(current));
  appearanceTransition = transition;
  function finish() {
    if (appearanceTransition !== transition) return;
    appearanceTransition = undefined;
    root.classList.remove("appearance-changing");
  }
  void transition.ready.catch(() => {});
  void transition.finished.then(finish, finish);
}

function restorePreferences(animate = false) {
  current = readPreferences();
  updateAppearance(animate);
}

export function savePreferences(preferences: Preferences) {
  current = preferences;
  updateAppearance(true);
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // The preferences remain usable for the current page.
  }
}

systemTheme.addEventListener("change", () => {
  if (current.theme === "auto") updateAppearance(true);
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) restorePreferences();
});
window.addEventListener("storage", (event) => {
  if (event.key === storageKey || event.key === null) restorePreferences(true);
});
