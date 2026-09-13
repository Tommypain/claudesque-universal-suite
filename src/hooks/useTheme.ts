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

/** Applies theme (light/dark/system) and the active-app accent to :root. */
export function useTheme() {
  const theme = useAppStore((s) => s.theme);
  const themeStyle = useAppStore((s) => s.themeStyle);
  const activeApp = useAppStore((s) => s.activeApp);
  const colors = useAppStore((s) => s.colors);

  // Theme Mode (light / dark / system)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.setAttribute("data-theme", resolved);
      if (resolved === "dark") {
        body.classList.add("dark");
      } else {
        body.classList.remove("dark");
      }
    };
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  // Theme Style (Default, Liquid Glass, Coastal Warmth, Driftwood Slate, Sage Botanical)
  useEffect(() => {
    const body = document.body;
    body.classList.remove(
      "theme-default",
      "theme-liquid-glass",
      "theme-coastal-warmth",
      "theme-driftwood-slate",
      "theme-sage-botanical",
      "layout-basic",
      "layout-liquid-glass"
    );

    if (themeStyle === "liquid-glass") {
      body.classList.add("theme-liquid-glass", "layout-liquid-glass");
    } else if (themeStyle === "coastal-warmth") {
      body.classList.add("theme-coastal-warmth", "layout-basic");
    } else if (themeStyle === "driftwood-slate") {
      body.classList.add("theme-driftwood-slate", "layout-basic");
    } else if (themeStyle === "sage-botanical") {
      body.classList.add("theme-sage-botanical", "layout-basic");
    } else {
      body.classList.add("theme-default", "layout-basic");
    }
  }, [themeStyle]);

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
