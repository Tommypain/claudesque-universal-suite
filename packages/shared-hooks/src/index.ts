export { useAppStore, DEFAULT_COLORS } from "./store/useAppStore";
export type { AppId, ThemeMode, AppColors, Toast } from "./store/useAppStore";
export { useDocumentStore } from "./store/useDocumentStore";
export type { SlideText, Slide } from "./store/useDocumentStore";

export { useFileManager } from "./hooks/useFileManager";
export { useKeyboard } from "./hooks/useKeyboard";
export { useTheme } from "./hooks/useTheme";
export { ensureScript } from "./lib/ensureScript";
