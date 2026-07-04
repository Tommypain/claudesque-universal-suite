import { create } from "zustand";

export type AppId = "write" | "sheet" | "present" | "pdf" | "design";
export type ThemeMode = "light" | "dark" | "system";

export interface AppColors {
  write: string;
  sheet: string;
  present: string;
  pdf: string;
  design: string;
}

export const DEFAULT_COLORS: AppColors = {
  write: "#1d4ed8",
  sheet: "#15803d",
  present: "#b45309",
  pdf: "#7c3aed",
  design: "#0891b2",
};

export interface Toast {
  id: number;
  message: string;
}

interface AppState {
  activeApp: AppId;
  theme: ThemeMode;
  colors: AppColors;
  settingsOpen: boolean;
  toasts: Toast[];
  setActiveApp: (a: AppId) => void;
  setTheme: (t: ThemeMode) => void;
  setColor: (a: AppId, c: string) => void;
  resetColor: (a: AppId) => void;
  resetAllColors: () => void;
  toggleSettings: (open?: boolean) => void;
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

function loadTheme(): ThemeMode {
  if (typeof localStorage === "undefined") return "system";
  return (localStorage.getItem("octopus-theme") as ThemeMode) || "system";
}

function persist(colors: AppColors) {
  try {
    localStorage.setItem("octopus-colors", JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

let toastId = 0;

export const useAppStore = create<AppState>((set, get) => ({
  activeApp: "write",
  theme: loadTheme(),
  colors: loadColors(),
  settingsOpen: false,
  toasts: [],
  setActiveApp: (a) => set({ activeApp: a }),
  setTheme: (t) => {
    try {
      localStorage.setItem("octopus-theme", t);
    } catch {
      /* ignore */
    }
    set({ theme: t });
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
  addToast: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().removeToast(id), 2600);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
