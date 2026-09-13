import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Applies three-layer appearance (mode, taste, colorScheme) and active-app accent to DOM. */
export function useTheme() {
  const mode = useAppStore((s) => s.mode);
  const taste = useAppStore((s) => s.taste);
  const colorScheme = useAppStore((s) => s.colorScheme);
  const theme = useAppStore((s) => s.theme);
  const themeStyle = useAppStore((s) => s.themeStyle);
  const activeApp = useAppStore((s) => s.activeApp);
  const colors = useAppStore((s) => s.colors);

  // 1. Theme Color Scheme (light / dark / system)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const scheme = colorScheme || theme || "system";
    const apply = () => {
      const resolved =
        scheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : scheme;
      root.setAttribute("data-theme", resolved);
      if (resolved === "dark") {
        body.classList.add("dark");
      } else {
        body.classList.remove("dark");
      }
    };
    apply();
    if (scheme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [colorScheme, theme]);

  // 2. Visual Mode (Normal vs Liquid Glass)
  useEffect(() => {
    const body = document.body;
    body.classList.remove(
      "mode-normal",
      "mode-liquid-glass",
      "layout-basic",
      "layout-liquid-glass",
      "theme-default",
      "theme-liquid-glass"
    );

    const activeMode = mode || (themeStyle === "liquid-glass" ? "liquid-glass" : "normal");
    if (activeMode === "liquid-glass") {
      body.classList.add("mode-liquid-glass", "layout-liquid-glass", "theme-liquid-glass");
    } else {
      body.classList.add("mode-normal", "layout-basic", "theme-default");
    }
  }, [mode, themeStyle]);

  // 3. Taste (Default, Ocean, Forest, Rose, Graphite)
  useEffect(() => {
    const body = document.body;
    const tasteClasses = [
      "taste-default",
      "taste-ocean",
      "taste-forest",
      "taste-rose",
      "taste-graphite",
      "theme-coastal-warmth",
      "theme-driftwood-slate",
      "theme-sage-botanical",
    ];
    body.classList.remove(...tasteClasses);

    const activeTaste = taste || "default";
    body.classList.add(`taste-${activeTaste}`);
  }, [taste]);

  // Accent per active app + custom colors
  useEffect(() => {
    const root = document.documentElement;
    const c = colors[activeApp] || colors.write;
    root.style.setProperty("--accent", c);
    root.style.setProperty("--accent-rgb", hexToRgb(c));
    root.style.setProperty("--app-write", colors.write);
    root.style.setProperty("--app-sheet", colors.sheet);
    root.style.setProperty("--app-present", colors.present);
    root.style.setProperty("--app-pdf", colors.pdf);
    root.style.setProperty("--app-converter", colors.converter);
    root.style.setProperty("--app-design", colors.design);
    root.style.setProperty("--app-html", colors.html);
  }, [activeApp, colors]);
}
