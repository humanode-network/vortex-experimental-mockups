const themes = ["sky", "light", "night"] as const;
export type Theme = (typeof themes)[number];

const STORAGE_KEY = "vortex.theme";

function isTheme(value: unknown): value is Theme {
  return (
    typeof value === "string" && (themes as readonly string[]).includes(value)
  );
}

export function getStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore persistence failures (private mode, disabled storage)
  }
}

export function initTheme(defaultTheme: Theme = "sky") {
  const stored = getStoredTheme();
  applyTheme(stored ?? defaultTheme);
}
