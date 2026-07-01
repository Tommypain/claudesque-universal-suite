import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeName = "solid" | "glass-light" | "glass-dark";

export interface ThemeState {
  theme: ThemeName;
  blur: number; // px, 0-40
  opacity: number; // percent, 30-95
  wallpaper: boolean;
  setTheme: (t: ThemeName) => void;
  setBlur: (n: number) => void;
  setOpacity: (n: number) => void;
  setWallpaper: (b: boolean) => void;
  isGlass: boolean;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("glass-light");
  const [blur, setBlur] = useState<number>(18);
  const [opacity, setOpacity] = useState<number>(70);
  const [wallpaper, setWallpaper] = useState<boolean>(true);

  const value = useMemo<ThemeState>(
    () => ({
      theme,
      blur,
      opacity,
      wallpaper,
      setTheme,
      setBlur,
      setOpacity,
      setWallpaper,
      isGlass: theme !== "solid",
    }),
    [theme, blur, opacity, wallpaper],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
