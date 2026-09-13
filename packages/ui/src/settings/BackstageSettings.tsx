import { useAppStore, type AppId } from "@liberty/shared-hooks";
import { useState, useEffect } from "react";
import { SettingsIcon, CloseIcon, CheckIcon } from "@liberty/icons";

interface BackstageSettingsProps {
  onClose: () => void;
}

type SettingsSection = "appearance" | "editor" | "canvas" | "performance" | "general";

/**
 * BackstageSettings — Centered floating settings modal for Liberty Studio.
 * Floats elevated above the active application workspace, with backdrop blur,
 * full active theme adaptation (including macOS Liquid Glass), keyboard (Escape)
 * dismissal, and organized settings categories.
 */
export function BackstageSettings({ onClose }: BackstageSettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  const theme = useAppStore((s: any) => s.theme);
  const setTheme = useAppStore((s: any) => s.setTheme);
  const themeStyle = useAppStore((s: any) => s.themeStyle);
  const setThemeStyle = useAppStore((s: any) => s.setThemeStyle);
  const colors = useAppStore((s: any) => s.colors);
  const setColor = useAppStore((s: any) => s.setColor);
  const resetColor = useAppStore((s: any) => s.resetColor);
  const resetAllColors = useAppStore((s: any) => s.resetAllColors);

  // Extended workspace preferences
  const uiDensity = useAppStore((s: any) => s.uiDensity || "comfortable");
  const setUiDensity = useAppStore((s: any) => s.setUiDensity);
  const editorFont = useAppStore((s: any) => s.editorFont || "system");
  const setEditorFont = useAppStore((s: any) => s.setEditorFont);
  const editorFontSize = useAppStore((s: any) => s.editorFontSize || 14);
  const setEditorFontSize = useAppStore((s: any) => s.setEditorFontSize);
  const editorLineHeight = useAppStore((s: any) => s.editorLineHeight || "1.6");
  const setEditorLineHeight = useAppStore((s: any) => s.setEditorLineHeight);
  const editorWordWrap = useAppStore((s: any) => s.editorWordWrap ?? true);
  const setEditorWordWrap = useAppStore((s: any) => s.setEditorWordWrap);
  const canvasGrid = useAppStore((s: any) => s.canvasGrid ?? true);
  const setCanvasGrid = useAppStore((s: any) => s.setCanvasGrid);
  const canvasSnap = useAppStore((s: any) => s.canvasSnap ?? true);
  const setCanvasSnap = useAppStore((s: any) => s.setCanvasSnap);
  const canvasRulers = useAppStore((s: any) => s.canvasRulers ?? false);
  const setCanvasRulers = useAppStore((s: any) => s.setCanvasRulers);
  const hardwareAcceleration = useAppStore((s: any) => s.hardwareAcceleration ?? true);
  const setHardwareAcceleration = useAppStore((s: any) => s.setHardwareAcceleration);
  const language = useAppStore((s: any) => s.language || "en");
  const setLanguage = useAppStore((s: any) => s.setLanguage);
  const autoSaveInterval = useAppStore((s: any) => s.autoSaveInterval || "instant");
  const setAutoSaveInterval = useAppStore((s: any) => s.setAutoSaveInterval);

  // Local state for interactive controls
  const [autoPair, setAutoPair] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [memoryCache, setMemoryCache] = useState(true);
  const [highDpi, setHighDpi] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [canvasUnits, setCanvasUnits] = useState("mm");

  // Keyboard dismiss on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const themeOptions = [
    {
      id: "default",
      name: "Default Theme (Liberty Classic)",
      desc: "Warm ivory parchment, subtle borders, and classic capsule controls.",
      preview: ["#fbfbfa", "#f3f3ee", "#1a1a1a", "#1d4ed8"],
    },
    {
      id: "liquid-glass",
      name: "macOS Liquid Glass",
      desc: "Apple-inspired translucent surfaces, saturated backdrop blur, and depth.",
      preview: ["#edd8fc", "#e0e7ff", "#1e1b4b", "#7c3aed"],
    },
    {
      id: "coastal-warmth",
      name: "Coastal Warmth",
      desc: "Terracotta (#AD7556) & Chambray (#7A9CB3) with warm Sandstone and Muslin.",
      preview: ["#F1EFE6", "#DCCFB8", "#AD7556", "#7A9CB3"],
    },
    {
      id: "driftwood-slate",
      name: "Driftwood & Slate",
      desc: "Pearl Shell (#EDE7E0) & Slate Pebble (#5E6C74) with Weathered Driftwood.",
      preview: ["#EDE7E0", "#C9BCAD", "#8F8476", "#5E6C74"],
    },
    {
      id: "sage-botanical",
      name: "Sage Botanical",
      desc: "Plaster (#F2EFE2) & Eucalyptus (#98AA9D) with Moss (#697C70) and Mist.",
      preview: ["#F2EFE2", "#B3C9D6", "#98AA9D", "#697C70"],
    },
  ] as const;

  const sections = [
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "editor", label: "Editor", icon: "📝" },
    { id: "canvas", label: "Canvas", icon: "📐" },
    { id: "performance", label: "Performance", icon: "⚡" },
    { id: "general", label: "General", icon: "⚙️" },
  ] as const;

  const appList: { id: AppId; label: string }[] = [
    { id: "write", label: "Docs (.docx)" },
    { id: "present", label: "Slides (.pptx)" },
    { id: "sheet", label: "Sheet (.xlsx)" },
    { id: "pdf", label: "PDF Viewer" },
    { id: "html", label: "HTML Studio" },
    { id: "design", label: "Vector Design" },
    { id: "converter", label: "Converter" },
  ];

  return (
    <div
      className="settings-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="settings-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: "var(--color-background-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--color-border-secondary)",
                color: "var(--color-accent, #1d4ed8)",
              }}
            >
              <SettingsIcon size={16} />
            </div>
            <div>
              <span
                id="settings-dialog-title"
                style={{
                  fontWeight: 700,
                  fontSize: "14.5px",
                  color: "var(--color-text-primary)",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                Settings Console
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                Liberty Studio Preferences
              </span>
            </div>
          </div>

          <button
            className="btn"
            style={{
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
            }}
            onClick={onClose}
            title="Close (Escape)"
            aria-label="Close settings modal"
          >
            <CloseIcon size={14} />
            <span>Esc</span>
          </button>
        </div>

        {/* Modal Body: Sidebar + Content */}
        <div className="settings-modal-body">
          {/* Navigation Sidebar */}
          <div className="settings-modal-sidebar">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`settings-modal-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setActiveSection(sec.id)}
                >
                  <span style={{ fontSize: "14px" }}>{sec.icon}</span>
                  <span>{sec.label}</span>
                </div>
              );
            })}
          </div>

          {/* Scrollable Content Area */}
          <div className="settings-modal-content">
            {/* 1. Appearance Section */}
            {activeSection === "appearance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    Theme & Style
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                    Select the workspace visual design theme and token palette.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {themeOptions.map((opt) => {
                      const isSelected = (themeStyle || "default") === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`settings-theme-card ${isSelected ? "active" : ""}`}
                          onClick={() => setThemeStyle(opt.id)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--color-text-primary)" }}>
                                {opt.name}
                              </span>
                              {isSelected && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "1px 6px",
                                    borderRadius: "10px",
                                    background: "var(--color-accent, #1d4ed8)",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  <CheckIcon size={10} /> Active
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {opt.preview.map((col, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: col,
                                    border: "1px solid rgba(0,0,0,0.15)",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", display: "block", lineHeight: 1.35 }}>
                            {opt.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Mode: Light / Dark / System */}
                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    System Theme Mode
                  </h4>
                  <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "10px" }}>
                    Switch between daytime light mode, dark mode, or follow your operating system appearance.
                  </p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {(["light", "dark", "system"] as const).map((m) => (
                      <button
                        key={m}
                        className={`btn ${theme === m ? "active" : ""}`}
                        style={{
                          flex: 1,
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: theme === m ? 600 : 400,
                          textTransform: "capitalize",
                        }}
                        onClick={() => setTheme(m)}
                      >
                        {m === "light" ? "☀ Light" : m === "dark" ? "🌙 Dark" : "💻 System"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* App Accent Colors */}
                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Application Accent Colors
                    </h4>
                    <button
                      className="btn"
                      style={{ fontSize: "11px", padding: "2px 8px" }}
                      onClick={resetAllColors}
                    >
                      Reset All
                    </button>
                  </div>
                  <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                    Customize signature accent indicators for each core workspace app.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {appList.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "var(--color-background-secondary)",
                          border: "1px solid var(--color-border-secondary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="color"
                            value={colors[app.id] || "#1d4ed8"}
                            onChange={(e) => setColor(app.id, e.target.value)}
                            style={{
                              width: 26,
                              height: 26,
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              padding: 0,
                              background: "transparent",
                            }}
                          />
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                            {app.label}
                          </span>
                        </div>
                        <button
                          className="btn"
                          style={{ fontSize: "11px", padding: "2px 8px" }}
                          onClick={() => resetColor(app.id)}
                        >
                          Reset
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UI Density */}
                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Interface Density
                  </h4>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    <button
                      className={`btn ${uiDensity === "comfortable" ? "active" : ""}`}
                      style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                      onClick={() => setUiDensity && setUiDensity("comfortable")}
                    >
                      Comfortable (Default)
                    </button>
                    <button
                      className={`btn ${uiDensity === "compact" ? "active" : ""}`}
                      style={{ flex: 1, padding: "6px", fontSize: "12px" }}
                      onClick={() => setUiDensity && setUiDensity("compact")}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Editor Section */}
            {activeSection === "editor" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Editor & Typography
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                    Fine-tune font formatting, line spacing, and code editor behavior.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Font Family
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Primary typeface for editor surfaces
                      </span>
                    </div>
                    <select
                      className="fsel"
                      value={editorFont}
                      onChange={(e) => setEditorFont && setEditorFont(e.target.value)}
                      style={{ minWidth: "160px", height: "28px" }}
                    >
                      <option value="system">System Sans-Serif</option>
                      <option value="serif">Serif (Times / Georgia)</option>
                      <option value="mono">Monospace (Code / Mono)</option>
                      <option value="inter">Inter Display</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Font Size
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Default text point size
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[12, 14, 16, 18].map((sz) => (
                        <button
                          key={sz}
                          className={`btn ${editorFontSize === sz ? "active" : ""}`}
                          style={{ padding: "3px 10px", fontSize: "12px" }}
                          onClick={() => setEditorFontSize && setEditorFontSize(sz)}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Line Height
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Vertical paragraph and code pacing
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {["1.4", "1.6", "1.8"].map((lh) => (
                        <button
                          key={lh}
                          className={`btn ${editorLineHeight === lh ? "active" : ""}`}
                          style={{ padding: "3px 10px", fontSize: "12px" }}
                          onClick={() => setEditorLineHeight && setEditorLineHeight(lh)}
                        >
                          {lh === "1.4" ? "Compact (1.4)" : lh === "1.6" ? "Normal (1.6)" : "Relaxed (1.8)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    Code & Markup Behavior
                  </h4>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={editorWordWrap}
                      onChange={(e) => setEditorWordWrap && setEditorWordWrap(e.target.checked)}
                    />
                    <span>Enable automatic word wrapping in HTML Studio & Source Code view</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={autoPair}
                      onChange={(e) => setAutoPair(e.target.checked)}
                    />
                    <span>Auto-pair quotation marks and syntax brackets</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                    />
                    <span>Display line numbers in code editing view</span>
                  </label>
                </div>
              </div>
            )}

            {/* 3. Canvas Section */}
            {activeSection === "canvas" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Canvas & Layout Guides
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                    Configure physical document canvas grids, rulers, and snap settings.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Show Canvas Grid
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Render subtle background grid dots in HTML Studio and vector canvas
                      </span>
                    </div>
                    <button
                      className={`btn ${canvasGrid ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setCanvasGrid && setCanvasGrid(!canvasGrid)}
                    >
                      {canvasGrid ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Snap to Grid
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Snap elements to 8px intervals during drag and resize operations
                      </span>
                    </div>
                    <button
                      className={`btn ${canvasSnap ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setCanvasSnap && setCanvasSnap(!canvasSnap)}
                    >
                      {canvasSnap ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Physical Document Rulers
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Display top horizontal millimeter/inch ruler bar
                      </span>
                    </div>
                    <button
                      className={`btn ${canvasRulers ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setCanvasRulers && setCanvasRulers(!canvasRulers)}
                    >
                      {canvasRulers ? "Visible" : "Hidden"}
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Measurement Units
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Standard physical layout dimension unit
                      </span>
                    </div>
                    <select
                      className="fsel"
                      value={canvasUnits}
                      onChange={(e) => setCanvasUnits(e.target.value)}
                      style={{ minWidth: "140px", height: "28px" }}
                    >
                      <option value="mm">Millimeters (mm) — Print</option>
                      <option value="px">Pixels (px) — Screen</option>
                      <option value="in">Inches (in)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Performance Section */}
            {activeSection === "performance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Performance & Engine Status
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                    Manage client-side sandboxed calculation cores and graphics rasterization.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        GPU Hardware Acceleration
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Accelerate canvas rendering and glass blur shaders via WebGL
                      </span>
                    </div>
                    <button
                      className={`btn ${hardwareAcceleration ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setHardwareAcceleration && setHardwareAcceleration(!hardwareAcceleration)}
                    >
                      {hardwareAcceleration ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        In-Memory Document Cache
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Retain AST cache for instant tab switching across applications
                      </span>
                    </div>
                    <button
                      className={`btn ${memoryCache ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setMemoryCache(!memoryCache)}
                    >
                      {memoryCache ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        High-DPI Canvas Rendering
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Supersample vector graphics and text on Retina/4K displays
                      </span>
                    </div>
                    <button
                      className={`btn ${highDpi ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setHighDpi(!highDpi)}
                    >
                      {highDpi ? "Active (2x)" : "Standard"}
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "14px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
                    Omega Engine Diagnostics
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, display: "block" }}>Formula Evaluator</span>
                      <span style={{ color: "#16a34a", fontSize: "10.5px" }}>● Threaded Evaluator v2.1</span>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, display: "block" }}>OOXML Parser</span>
                      <span style={{ color: "#2563eb", fontSize: "10.5px" }}>● Mammoth.JS + Schemas</span>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, display: "block" }}>PDF Engine</span>
                      <span style={{ color: "#9333ea", fontSize: "10.5px" }}>● PDF.JS Worker Thread</span>
                    </div>
                    <div style={{ padding: "8px 10px", borderRadius: "6px", background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)", fontSize: "11.5px" }}>
                      <span style={{ fontWeight: 600, display: "block" }}>Vector Core</span>
                      <span style={{ color: "#0891b2", fontSize: "10.5px" }}>● Native SVG 2.0 Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. General Section */}
            {activeSection === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    General Preferences & Security
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                    Application localization, auto-save triggers, and local security registration.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Interface Language
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        UI localized string presentation
                      </span>
                    </div>
                    <select
                      className="fsel"
                      value={language}
                      onChange={(e) => setLanguage && setLanguage(e.target.value)}
                      style={{ minWidth: "160px", height: "28px" }}
                    >
                      <option value="en">English (US)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="fr">Français (French)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="de">Deutsch (German)</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Auto-Save Frequency
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        How often document changes sync to local cache
                      </span>
                    </div>
                    <select
                      className="fsel"
                      value={autoSaveInterval}
                      onChange={(e) => setAutoSaveInterval && setAutoSaveInterval(e.target.value)}
                      style={{ minWidth: "160px", height: "28px" }}
                    >
                      <option value="instant">Instant on change (Recommended)</option>
                      <option value="30s">Every 30 seconds</option>
                      <option value="1m">Every 1 minute</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "6px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 600, display: "block", color: "var(--color-text-primary)" }}>
                        Toast Notifications
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        Show popup status indicators when actions complete
                      </span>
                    </div>
                    <button
                      className={`btn ${notifications ? "active" : ""}`}
                      style={{ padding: "4px 12px", fontSize: "12px" }}
                      onClick={() => setNotifications(!notifications)}
                    >
                      {notifications ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "14px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
                    Originality & Licensing Stamp
                  </h4>
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: "var(--color-background-secondary)",
                      border: "1px solid var(--color-border-secondary)",
                      fontSize: "11.5px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Build Edition:</span>
                      <span style={{ fontWeight: 600 }}>v0.0.0.1.0 (Enterprise Sandboxed)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>System Registration:</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>OMS-9021-A938-CC21</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Cryptographic Node:</span>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>RSA-4096 Signed Environment</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-accent, #1d4ed8)",
                display: "inline-block",
              }}
            />
            <span>
              Theme: <strong>{themeStyle || "default"}</strong> ({theme})
            </span>
          </div>

          <button
            className="btn active"
            style={{
              padding: "5px 18px",
              fontWeight: 600,
              fontSize: "12px",
              borderRadius: "14px",
            }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
