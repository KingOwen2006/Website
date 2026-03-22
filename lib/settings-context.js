"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ACCENT_SWATCHES = {
  blue: "#4285F4",
  coral: "#F47C6F",
  mint: "#3BCABF",
  lilac: "#8C78D9",
  mono: "#808080",
};

const HUE_OFFSET_2 = 40;
const HUE_OFFSET_3 = 80;

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const r = Math.round(f(0) * 255),
    g = Math.round(f(8) * 255),
    b = Math.round(f(4) * 255);
  return (
    "#" +
    [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")
  );
}

function getStored(key, def) {
  if (typeof window === "undefined") return def;
  try {
    return localStorage.getItem("ko-settings-" + key) || def;
  } catch {
    return def;
  }
}

function setStored(key, val) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ko-settings-" + key, val);
    if (key === "theme") {
      const effective =
        val === "auto"
          ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : val;
      localStorage.setItem("theme", effective);
    }
  } catch {}
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [accent, setAccentState] = useState("mint");
  const [viewMode, setViewModeState] = useState("wireframe");
  const [glassMode, setGlassModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getStored("theme", "dark"));
    setAccentState(getStored("accent", "mint"));
    setViewModeState(getStored("viewmode", "wireframe"));
    setGlassModeState(getStored("glassmode", "false") === "true");
    setMounted(true);
  }, []);

  const applyThemeToDOM = useCallback((val) => {
    const root = document.documentElement;
    if (val === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.setAttribute("data-theme", mq.matches ? "dark" : "light");
      const handler = (e) =>
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      root.setAttribute("data-theme", val);
    }
  }, []);

  const applyAccentToDOM = useCallback((val) => {
    const root = document.documentElement;
    const hex = ACCENT_SWATCHES[val] || ACCENT_SWATCHES.mint;
    const { h, s, l } = hexToHsl(hex);
    root.style.setProperty("--accent", hex);
    if (s < 5) {
      root.style.setProperty(
        "--accent2",
        hslToHex(0, 0, Math.min(100, l + 12))
      );
      root.style.setProperty(
        "--accent3",
        hslToHex(0, 0, Math.max(0, l - 12))
      );
    } else {
      root.style.setProperty(
        "--accent2",
        hslToHex((h + HUE_OFFSET_2) % 360, s, l)
      );
      root.style.setProperty(
        "--accent3",
        hslToHex((h + HUE_OFFSET_3) % 360, s, l)
      );
    }
  }, []);

  const applyViewModeToDOM = useCallback((val) => {
    document.documentElement.setAttribute("data-viewmode", val);
    if (window.applySceneViewMode) window.applySceneViewMode(val);
  }, []);

  const applyGlassModeToDOM = useCallback((val) => {
    document.documentElement.setAttribute("data-glassmode", val ? "true" : "false");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const cleanup = applyThemeToDOM(theme);
    setStored("theme", theme);
    return cleanup;
  }, [theme, mounted, applyThemeToDOM]);

  useEffect(() => {
    if (!mounted) return;
    applyAccentToDOM(accent);
    setStored("accent", accent);
  }, [accent, mounted, applyAccentToDOM]);

  useEffect(() => {
    if (!mounted) return;
    applyViewModeToDOM(viewMode);
    setStored("viewmode", viewMode);
  }, [viewMode, mounted, applyViewModeToDOM]);

  useEffect(() => {
    if (!mounted) return;
    applyGlassModeToDOM(glassMode);
    setStored("glassmode", glassMode ? "true" : "false");
  }, [glassMode, mounted, applyGlassModeToDOM]);

  const setTheme = useCallback((val) => setThemeState(val), []);
  const setAccent = useCallback((val) => setAccentState(val), []);
  const setViewMode = useCallback((val) => setViewModeState(val), []);
  const setGlassMode = useCallback((val) => setGlassModeState(val), []);

  return (
    <SettingsContext.Provider
      value={{ theme, accent, viewMode, glassMode, setTheme, setAccent, setViewMode, setGlassMode, mounted }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export { ACCENT_SWATCHES };
