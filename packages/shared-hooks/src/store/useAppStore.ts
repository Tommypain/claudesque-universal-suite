import { create } from "zustand";

export type AppId = "write" | "sheet" | "present" | "pdf" | "converter" | "design" | "html";
export type ThemeMode = "light" | "dark" | "system";
export type ThemeStyle = "default" | "liquid-glass" | "coastal-warmth" | "driftwood-slate" | "sage-botanical";

export type AppearanceMode = "normal" | "liquid-glass";
export type AppearanceTaste = "default" | "ocean" | "forest" | "rose" | "graphite";
export type AppearanceScheme = "system" | "light" | "dark";
export type ThumbnailSize = "normal" | "medium" | "small";

export interface AppearanceState {
  mode: AppearanceMode;
  taste: AppearanceTaste;
  colorScheme: AppearanceScheme;
}

export interface AppColors {
  write: string;
  sheet: string;
  present: string;
  pdf: string;
  converter: string;
  design: string;
  html: string;
}

export const DEFAULT_COLORS: AppColors = {
  write: "#1d4ed8",
  sheet: "#15803d",
  present: "#b45309",
  pdf: "#7c3aed",
  converter: "#6366f1",
  design: "#0891b2",
  html: "#0284c7",
};

export interface Toast {
  id: number;
  message: string;
}

interface AppState {
  activeApp: AppId;
  theme: ThemeMode;
  themeStyle: ThemeStyle;
  // Three-layer appearance system
  mode: AppearanceMode;
  taste: AppearanceTaste;
  colorScheme: AppearanceScheme;
  thumbnailSize: ThumbnailSize;
  colors: AppColors;
  settingsOpen: boolean;
  toasts: Toast[];
  uiDensity: "comfortable" | "compact";
  editorFont: string;
  editorFontSize: number;
  editorLineHeight: string;
  editorWordWrap: boolean;
  canvasGrid: boolean;
  canvasSnap: boolean;
  canvasRulers: boolean;
  hardwareAcceleration: boolean;
  language: string;
  autoSaveInterval: string;
  setActiveApp: (a: AppId) => void;
  setTheme: (t: ThemeMode) => void;
  setThemeStyle: (s: ThemeStyle) => void;
  setMode: (m: AppearanceMode) => void;
  setTaste: (t: AppearanceTaste) => void;
  setColorScheme: (s: AppearanceScheme) => void;
  setThumbnailSize: (s: ThumbnailSize) => void;
  setColor: (a: AppId, c: string) => void;
  resetColor: (a: AppId) => void;
  resetAllColors: () => void;
  toggleSettings: (open?: boolean) => void;
  setUiDensity: (d: "comfortable" | "compact") => void;
  setEditorFont: (f: string) => void;
  setEditorFontSize: (s: number) => void;
  setEditorLineHeight: (l: string) => void;
  setEditorWordWrap: (w: boolean) => void;
  setCanvasGrid: (g: boolean) => void;
  setCanvasSnap: (s: boolean) => void;
  setCanvasRulers: (r: boolean) => void;
  setHardwareAcceleration: (h: boolean) => void;
  setLanguage: (l: string) => void;
  setAutoSaveInterval: (i: string) => void;
  addToast: (message: string) => void;
  removeToast: (id: number) => void;
}

function loadColors(): AppColors {
  if (typeof localStorage === "undefined") return { ...DEFAULT_COLORS };
  try {
    const raw = localStorage.getItem("octopus-colors");
    if (raw) return { ...DEFAULT_COLORS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_COLORS };
}

function loadAppearance(): AppearanceState {
  if (typeof localStorage === "undefined") {
    return { mode: "normal", taste: "default", colorScheme: "system" };
  }
  try {
    const raw = localStorage.getItem("liberty-appearance");
    if (raw) return JSON.parse(raw);
    const legacyLayout = localStorage.getItem("suite-layout-style");
    const legacyTheme = localStorage.getItem("suite-theme-id");
    const legacyMode = localStorage.getItem("octopus-theme-mode") || localStorage.getItem("octopus-theme");
    return {
      mode: legacyLayout === "liquid-glass" ? "liquid-glass" : "normal",
      taste: (["default", "ocean", "forest", "rose", "graphite"].includes(legacyTheme || "") ? legacyTheme : "default") as any,
      colorScheme: (legacyMode || "system") as any,
    };
  } catch {
    return { mode: "normal", taste: "default", colorScheme: "system" };
  }
}

function persistAppearance(app: AppearanceState) {
  try {
    localStorage.setItem("liberty-appearance", JSON.stringify(app));
    localStorage.setItem("suite-layout-style", app.mode === "liquid-glass" ? "liquid-glass" : "basic");
    localStorage.setItem("suite-theme-id", app.taste);
    localStorage.setItem("octopus-theme-mode", app.colorScheme);
    localStorage.setItem("octopus-theme", app.colorScheme);
    if (typeof window !== "undefined" && (window as any).LibertyAppearance?.apply) {
      (window as any).LibertyAppearance.apply(app);
    }
  } catch {}
}

function persist(colors: AppColors) {
  try {
    localStorage.setItem("octopus-colors", JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

function loadThumbnailSize(): ThumbnailSize {
  if (typeof localStorage === "undefined") return "normal";
  try {
    const s = localStorage.getItem("liberty-thumbnail-size");
    if (s === "small" || s === "medium" || s === "normal") return s;
  } catch {}
  return "normal";
}

function persistThumbnailSize(size: ThumbnailSize) {
  try {
    localStorage.setItem("liberty-thumbnail-size", size);
    if (typeof window !== "undefined" && (window as any).LibertyThumbnailSystem?.setSize) {
      (window as any).LibertyThumbnailSystem.setSize(size);
    }
  } catch {}
}

let toastId = 0;
const initialAppearance = loadAppearance();

export const useAppStore = create<AppState>((set, get) => ({
  activeApp: "write",
  theme: initialAppearance.colorScheme,
  themeStyle: initialAppearance.taste === "default" ? "default" : (initialAppearance.taste as any),
  mode: initialAppearance.mode,
  taste: initialAppearance.taste,
  colorScheme: initialAppearance.colorScheme,
  thumbnailSize: loadThumbnailSize(),
  colors: loadColors(),
  settingsOpen: false,
  toasts: [],
  uiDensity: "comfortable",
  editorFont: "system",
  editorFontSize: 14,
  editorLineHeight: "1.6",
  editorWordWrap: true,
  canvasGrid: true,
  canvasSnap: true,
  canvasRulers: false,
  hardwareAcceleration: true,
  language: "en",
  autoSaveInterval: "instant",
  setActiveApp: (a) => set({ activeApp: a }),
  setTheme: (t) => {
    const next = { ...loadAppearance(), colorScheme: t };
    persistAppearance(next);
    set({ theme: t, colorScheme: t });
  },
  setThemeStyle: (s) => {
    const taste = (["default", "ocean", "forest", "rose", "graphite"].includes(s) ? s : "default") as AppearanceTaste;
    const mode = (s === "liquid-glass" ? "liquid-glass" : get().mode) as AppearanceMode;
    const next = { ...loadAppearance(), taste, mode };
    persistAppearance(next);
    set({ themeStyle: s, taste, mode });
  },
  setMode: (m) => {
    const next = { ...loadAppearance(), mode: m };
    persistAppearance(next);
    set({ mode: m });
  },
  setTaste: (t) => {
    const next = { ...loadAppearance(), taste: t };
    persistAppearance(next);
    set({ taste: t, themeStyle: t as any });
  },
  setColorScheme: (s) => {
    const next = { ...loadAppearance(), colorScheme: s };
    persistAppearance(next);
    set({ colorScheme: s, theme: s });
  },
  setThumbnailSize: (s) => {
    persistThumbnailSize(s);
    set({ thumbnailSize: s });
  },
  setColor: (a, c) => {
    const colors = { ...get().colors, [a]: c };
    persist(colors);
    set({ colors });
  },
  resetColor: (a) => {
    const colors = { ...get().colors, [a]: DEFAULT_COLORS[a] };
    persist(colors);
    set({ colors });
  },
  resetAllColors: () => {
    persist(DEFAULT_COLORS);
    set({ colors: { ...DEFAULT_COLORS } });
  },
  toggleSettings: (open) =>
    set((s) => ({ settingsOpen: open ?? !s.settingsOpen })),
  setUiDensity: (d) => set({ uiDensity: d }),
  setEditorFont: (f) => set({ editorFont: f }),
  setEditorFontSize: (s) => set({ editorFontSize: s }),
  setEditorLineHeight: (l) => set({ editorLineHeight: l }),
  setEditorWordWrap: (w) => set({ editorWordWrap: w }),
  setCanvasGrid: (g) => set({ canvasGrid: g }),
  setCanvasSnap: (s) => set({ canvasSnap: s }),
  setCanvasRulers: (r) => set({ canvasRulers: r }),
  setHardwareAcceleration: (h) => set({ hardwareAcceleration: h }),
  setLanguage: (l) => set({ language: l }),
  setAutoSaveInterval: (i) => set({ autoSaveInterval: i }),
  addToast: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().removeToast(id), 2600);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
