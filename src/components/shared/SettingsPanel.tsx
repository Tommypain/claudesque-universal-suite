import {
  useAppStore,
  type AppId,
  type ThemeMode,
  DEFAULT_COLORS,
} from "../../store/useAppStore";

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "light", label: "☀ Light" },
  { id: "dark", label: "🌙 Dark" },
  { id: "system", label: "🖥 System" },
];

const APP_LABELS: Record<AppId, string> = {
  write: "Write",
  sheet: "Sheet",
  present: "Present",
  pdf: "PDF",
};

export function SettingsPanel() {
  const open = useAppStore((s) => s.settingsOpen);
  const toggle = useAppStore((s) => s.toggleSettings);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const colors = useAppStore((s) => s.colors);
  const setColor = useAppStore((s) => s.setColor);
  const resetColor = useAppStore((s) => s.resetColor);
  const resetAllColors = useAppStore((s) => s.resetAllColors);

  if (!open) return null;

  return (
    <div className="oct-overlay" onClick={() => toggle(false)}>
      <div className="oct-settings" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <p style={{ color: "var(--text-2)", fontSize: 13 }}>Appearance</p>

        <h3>Theme</h3>
        <div className="oct-theme-btns">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`oct-theme-btn${theme === t.id ? " active" : ""}`}
              onClick={() => setTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h3>App accent colors</h3>
        {(Object.keys(APP_LABELS) as AppId[]).map((app) => (
          <div className="oct-color-item" key={app}>
            <input
              type="color"
              className="oct-color"
              value={colors[app]}
              onChange={(e) => setColor(app, e.target.value)}
            />
            <label>{APP_LABELS[app]}</label>
            <button className="oct-btn" onClick={() => resetColor(app)}>
              Reset
            </button>
          </div>
        ))}

        <h3>Preview</h3>
        <div className="oct-color-preview">
          {(Object.keys(APP_LABELS) as AppId[]).map((app) => (
            <div
              key={app}
              className="oct-circle"
              style={{ background: colors[app] }}
              title={APP_LABELS[app]}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="oct-btn" onClick={resetAllColors}>
            Reset all
          </button>
          <button className="oct-btn primary" onClick={() => toggle(false)}>
            Done
          </button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-2)", marginTop: 12 }}>
          Defaults: {Object.values(DEFAULT_COLORS).join(", ")}
        </p>
      </div>
    </div>
  );
}
