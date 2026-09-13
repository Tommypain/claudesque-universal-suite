export { useAppStore, DEFAULT_COLORS } from "./store/useAppStore";
export type { AppId, ThemeMode, ThemeStyle, AppColors, Toast } from "./store/useAppStore";
export { useDocumentStore, DEFAULT_HTML_DOC } from "./store/useDocumentStore";
export type { SlideText, Slide, VectorShape, HtmlPagePreset, HtmlPageMode, HtmlEditMode } from "./store/useDocumentStore";

export { useFileManager } from "./hooks/useFileManager";
export { useKeyboard } from "./hooks/useKeyboard";
export { useTheme } from "./hooks/useTheme";
export { ensureScript } from "./lib/ensureScript";
