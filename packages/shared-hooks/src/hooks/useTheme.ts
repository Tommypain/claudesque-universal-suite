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
  const activeApp = useAppStore((s) => s.activeApp);
  const colors = useAppStore((s) => s.colors);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.setAttribute("data-theme", resolved);
    };
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  // Accent per active app + custom colors
  useEffect(() => {
    const root = document.documentElement;
    const c = colors[activeApp];
    root.style.setProperty("--accent", c);
    root.style.setProperty("--accent-rgb", hexToRgb(c));
    root.style.setProperty("--app-write", colors.write);
    root.style.setProperty("--app-sheet", colors.sheet);
    root.style.setProperty("--app-present", colors.present);
    root.style.setProperty("--app-pdf", colors.pdf);
  }, [activeApp, colors]);
}
