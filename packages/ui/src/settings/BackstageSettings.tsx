import { useAppStore, type AppId } from "@liberty/shared-hooks";
import { useState, useEffect } from "react";
import {
  SettingsIcon,
  CloseIcon,
  CheckIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  PaletteIcon,
  WordIcon,
  LayoutIcon,
  KeyboardIcon,
  InfoIcon,
  SlidersIcon,
} from "@liberty/icons";

interface BackstageSettingsProps {
  onClose: () => void;
}

type SettingsTab =
  | "general"
  | "appearance"
  | "editor"
  | "canvas"
  | "shortcuts"
  | "performance"
  | "about";

/**
 * BackstageSettings — Claude-style Settings Modal for Liberty Studio.
 * Modeled directly after the official Claude.ai desktop control center layout:
 * minimal, elegant, uncluttered, with segmented icon controls, clean search,
 * and zero bloat.
 */
export function BackstageSettings({ onClose }: BackstageSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [searchQuery, setSearchQuery] = useState("");

  // Store state
  const theme = useAppStore((s: any) => s.theme);
  const setTheme = useAppStore((s: any) => s.setTheme);
  const themeStyle = useAppStore((s: any) => s.themeStyle);
  const setThemeStyle = useAppStore((s: any) => s.setThemeStyle);
  const mode = useAppStore((s: any) => s.mode || "normal");
  const setMode = useAppStore((s: any) => s.setMode);
  const taste = useAppStore((s: any) => s.taste || "default");
  const setTaste = useAppStore((s: any) => s.setTaste);
  const colorScheme = useAppStore((s: any) => s.colorScheme || s.theme || "system");
  const setColorScheme = useAppStore((s: any) => s.setColorScheme || s.setTheme);
  const colors = useAppStore((s: any) => s.colors);
  const setColor = useAppStore((s: any) => s.setColor);
  const resetColor = useAppStore((s: any) => s.resetColor);
  const resetAllColors = useAppStore((s: any) => s.resetAllColors);

  // Extended workspace preferences
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
  const autoSaveInterval = useAppStore((s: any) => s.autoSaveInterval || "instant");
  const setAutoSaveInterval = useAppStore((s: any) => s.setAutoSaveInterval);

  // Local user profile state (persisted in localStorage)
  const [userName, setUserName] = useState(() => {
    return (typeof localStorage !== "undefined" && localStorage.getItem("liberty-user-name")) || "Tom";
  });
  const [userNickname, setUserNickname] = useState(() => {
    return (typeof localStorage !== "undefined" && localStorage.getItem("liberty-user-nick")) || "Tom";
  });
  const [userRole, setUserRole] = useState(() => {
    return (typeof localStorage !== "undefined" && localStorage.getItem("liberty-user-role")) || "other";
  });
  const [userInstructions, setUserInstructions] = useState(() => {
    return (typeof localStorage !== "undefined" && localStorage.getItem("liberty-user-inst")) || "";
  });
  const [motionPref, setMotionPref] = useState<"system" | "reduced">("system");
  const [autoPair, setAutoPair] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [canvasUnits, setCanvasUnits] = useState("mm");

  const saveUserName = (val: string) => {
    setUserName(val);
    try { localStorage.setItem("liberty-user-name", val); } catch {}
  };
  const saveUserNick = (val: string) => {
    setUserNickname(val);
    try { localStorage.setItem("liberty-user-nick", val); } catch {}
  };
  const saveUserRole = (val: string) => {
    setUserRole(val);
    try { localStorage.setItem("liberty-user-role", val); } catch {}
  };
  const saveUserInst = (val: string) => {
    setUserInstructions(val);
    try { localStorage.setItem("liberty-user-inst", val); } catch {}
  };

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

  const navSettings = [
    { id: "general", label: "General", icon: <SettingsIcon size={16} /> },
    { id: "appearance", label: "Appearance", icon: <PaletteIcon size={16} /> },
    { id: "editor", label: "Editor", icon: <WordIcon size={16} /> },
    { id: "canvas", label: "Canvas", icon: <LayoutIcon size={16} /> },
    { id: "about", label: "About", icon: <InfoIcon size={16} /> },
  ] as const;

  const navCustomize = [
    { id: "shortcuts", label: "Shortcuts", icon: <KeyboardIcon size={16} /> },
    { id: "performance", label: "Performance", icon: <SlidersIcon size={16} /> },
  ] as const;

  const modeOptions = [
    {
      id: "normal" as const,
      name: "Normal (Default)",
      desc: "Clean solid capsule surfaces, high contrast, standard Liberty foundation.",
      badge: "Foundation",
    },
    {
      id: "liquid-glass" as const,
      name: "macOS Liquid Glass",
      desc: "Translucent acrylic blur, ambient depth, specular borders, macOS fluid styling.",
      badge: "macOS Acrylic",
    },
  ];

  const tasteOptions = [
    {
      id: "default" as const,
      name: "Liberty Amber",
      desc: "Warm amber & classic capsule accent",
      light: "#d97706",
      dark: "#f59e0b",
    },
    {
      id: "ocean" as const,
      name: "Ocean Sky",
      desc: "Nautical & deep azure sky blue",
      light: "#0284c7",
      dark: "#38bdf8",
    },
    {
      id: "forest" as const,
      name: "Forest Emerald",
      desc: "Botanical & vibrant emerald green",
      light: "#15803d",
      dark: "#4ade80",
    },
    {
      id: "rose" as const,
      name: "Rose Carmine",
      desc: "Carmine & punchy rose crimson",
      light: "#e11d48",
      dark: "#fb7185",
    },
    {
      id: "graphite" as const,
      name: "Graphite Pebble",
      desc: "Charcoal & architectural slate pebble",
      light: "#475569",
      dark: "#94a3b8",
    },
  ];

  const appList: { id: AppId; label: string }[] = [
    { id: "write", label: "Docs (.docx)" },
    { id: "present", label: "Slides (.pptx)" },
    { id: "sheet", label: "Sheet (.xlsx)" },
    { id: "pdf", label: "PDF Viewer" },
    { id: "html", label: "HTML Studio" },
    { id: "design", label: "Vector Design" },
    { id: "converter", label: "Converter" },
  ];

  const filteredNavSettings = navSettings.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNavCustomize = navCustomize.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Sleek Minimal Close Button (Top-Right like Claude) */}
        <button
          className="claude-close-btn"
          onClick={onClose}
          title="Close (Escape)"
          aria-label="Close settings"
        >
          <CloseIcon size={18} />
        </button>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div className="settings-modal-body" style={{ height: "100%" }}>
          {/* Left Sidebar (Claude Style) */}
          <div className="settings-modal-sidebar" style={{ width: "210px", padding: "16px 12px" }}>
            {/* Search Box */}
            <div className="claude-search-box">
              <SearchIcon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
              <input
                type="text"
                className="claude-search-input"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                    color: "inherit",
                    opacity: 0.7,
                  }}
                  onClick={() => setSearchQuery("")}
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>

            {/* Section 1: Settings */}
            <div className="claude-section-title">Settings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredNavSettings.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <div
                    key={item.id}
                    className={`claude-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Section 2: Customize */}
            <div className="claude-section-title" style={{ marginTop: "12px" }}>
              Customize
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredNavCustomize.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <div
                    key={item.id}
                    className={`claude-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                  >
                    <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content Area (Claude Style) */}
          <div className="settings-modal-content" style={{ padding: "28px 36px" }}>
            {/* 1. GENERAL TAB (Exact match to Claude Image 2) */}
            {activeTab === "general" && (
              <div>
                <h2
                  id="settings-dialog-title"
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: "20px",
                  }}
                >
                  Profile
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Avatar Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Avatar</span>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "var(--color-background-secondary)",
                        border: "1px solid var(--color-border-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {userName ? userName[0].toUpperCase() : "T"}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Full name</label>
                    <input
                      type="text"
                      className="claude-input"
                      value={userName}
                      onChange={(e) => saveUserName(e.target.value)}
                    />
                  </div>

                  {/* Nickname */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                      What should Liberty call you?
                    </label>
                    <input
                      type="text"
                      className="claude-input"
                      value={userNickname}
                      onChange={(e) => saveUserNick(e.target.value)}
                    />
                  </div>

                  {/* Work Description */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                      What best describes your work?
                    </label>
                    <select
                      className="claude-select"
                      value={userRole}
                      onChange={(e) => saveUserRole(e.target.value)}
                    >
                      <option value="developer">Engineering / Software</option>
                      <option value="designer">Design / Product</option>
                      <option value="writer">Content / Authoring</option>
                      <option value="researcher">Research / Science</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Instructions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
                      Instructions for Liberty
                    </label>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                      Liberty will keep these in mind across documents, presentations, and code authoring.
                    </span>
                    <textarea
                      className="claude-textarea"
                      placeholder="e.g. keep explanations brief and to the point"
                      value={userInstructions}
                      onChange={(e) => saveUserInst(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preferences Sub-Group */}
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginTop: "32px",
                    marginBottom: "20px",
                  }}
                >
                  Preferences
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Appearance (Theme Mode) with Segmented Icon Pill */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Appearance</span>
                    <div className="claude-segmented-control">
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "system" ? "active" : ""}`}
                        onClick={() => setColorScheme("system")}
                        title="System appearance"
                      >
                        <MonitorIcon size={15} />
                      </button>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "light" ? "active" : ""}`}
                        onClick={() => setColorScheme("light")}
                        title="Light mode"
                      >
                        <SunIcon size={15} />
                      </button>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "dark" ? "active" : ""}`}
                        onClick={() => setColorScheme("dark")}
                        title="Dark mode"
                      >
                        <MoonIcon size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Workspace Font */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Workspace font</span>
                    <select
                      className="claude-select"
                      style={{ minWidth: "160px" }}
                      value={editorFont}
                      onChange={(e) => setEditorFont && setEditorFont(e.target.value)}
                    >
                      <option value="system">Liberty Sans (Default)</option>
                      <option value="serif">Anthropic Serif</option>
                      <option value="mono">Monospace Code</option>
                      <option value="inter">Inter Display</option>
                    </select>
                  </div>

                  {/* Motion with Segmented Pill */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Motion
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", display: "block", marginTop: "2px" }}>
                        Reduce animation in interface transitions and canvas elements.
                      </span>
                    </div>
                    <div className="claude-segmented-control" style={{ flexShrink: 0 }}>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${motionPref === "system" ? "active" : ""}`}
                        onClick={() => setMotionPref("system")}
                      >
                        System
                      </button>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${motionPref === "reduced" ? "active" : ""}`}
                        onClick={() => setMotionPref("reduced")}
                      >
                        Reduced
                      </button>
                    </div>
                  </div>

                  {/* Auto-Save */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Auto-save interval
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", display: "block", marginTop: "2px" }}>
                        Persist edits to local cache automatically.
                      </span>
                    </div>
                    <select
                      className="claude-select"
                      style={{ minWidth: "180px" }}
                      value={autoSaveInterval}
                      onChange={(e) => setAutoSaveInterval && setAutoSaveInterval(e.target.value)}
                    >
                      <option value="instant">Instant on change (Recommended)</option>
                      <option value="30s">Every 30 seconds</option>
                      <option value="5m">Every 5 minutes</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE & THEMES TAB */}
            {activeTab === "appearance" && (
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  Appearance System
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                  Three-layer visual control: Mode (foundation vs glass), Taste (accent palette), and Scheme.
                </p>

                {/* LAYER 1: VISUAL MODE */}
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                      1. Visual Mode
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      Foundation vs macOS Acrylic
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {modeOptions.map((opt) => {
                      const isSelected = mode === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`settings-theme-card ${isSelected ? "active" : ""}`}
                          onClick={() => setMode(opt.id)}
                          style={{ cursor: "pointer", padding: "12px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-text-primary)" }}>
                              {opt.name}
                            </span>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 6px",
                                  borderRadius: "10px",
                                  background: "var(--accent, #d97706)",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <CheckIcon size={10} /> Active
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", display: "block", lineHeight: 1.35 }}>
                            {opt.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LAYER 2: TASTE (COLOR ACCENT) */}
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                      2. Taste (Accent Palette)
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      Dual swatches show Light / Dark counterparts
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {tasteOptions.map((t) => {
                      const isSelected = taste === t.id;
                      return (
                        <div
                          key={t.id}
                          className={`settings-theme-card ${isSelected ? "active" : ""}`}
                          onClick={() => setTaste(t.id)}
                          style={{ cursor: "pointer", padding: "10px 12px" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                <span
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    background: t.light,
                                    display: "inline-block",
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                                  }}
                                  title="Light counterpart"
                                />
                                <span
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    background: t.dark,
                                    display: "inline-block",
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
                                  }}
                                  title="Dark counterpart"
                                />
                              </div>
                              <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-text-primary)" }}>
                                {t.name}
                              </span>
                            </div>
                            {isSelected && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 6px",
                                  borderRadius: "10px",
                                  background: "var(--accent, #d97706)",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <CheckIcon size={10} /> Active
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", display: "block" }}>
                            {t.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LAYER 3: COLOR SCHEME */}
                <div style={{ marginBottom: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                      3. Color Scheme
                    </span>
                    <div className="claude-segmented-control">
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "system" ? "active" : ""}`}
                        onClick={() => setColorScheme("system")}
                        title="Follow OS settings"
                      >
                        <MonitorIcon size={14} /> System
                      </button>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "light" ? "active" : ""}`}
                        onClick={() => setColorScheme("light")}
                        title="Light mode"
                      >
                        <SunIcon size={14} /> Light
                      </button>
                      <button
                        type="button"
                        className={`claude-segmented-btn ${colorScheme === "dark" ? "active" : ""}`}
                        onClick={() => setColorScheme("dark")}
                        title="Dark mode"
                      >
                        <MoonIcon size={14} /> Dark
                      </button>
                    </div>
                  </div>
                </div>

                {/* LAYER 4: LIVE PREVIEW WIDGET */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color, rgba(0,0,0,0.1))",
                    background: "var(--surface-elevated, var(--surface, rgba(255,255,255,0.7)))",
                    marginBottom: "22px",
                    backdropFilter: mode === "liquid-glass" ? "blur(20px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary, var(--color-text-primary))" }}>
                      Interactive Live Test & Preview
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "var(--accent-soft, rgba(217,119,6,0.15))",
                        color: "var(--accent, #d97706)",
                        fontWeight: 600,
                      }}
                    >
                      {mode} • {taste} • {colorScheme}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        background: "var(--accent, #d97706)",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color, #ccc)",
                        background: "var(--surface, #fff)",
                        color: "var(--text-primary, #333)",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Secondary Button
                    </button>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--accent, #d97706)",
                        color: "var(--accent, #d97706)",
                        fontWeight: 500,
                      }}
                    >
                      Sample Badge
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border-secondary)", paddingTop: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Application Accent Colors
                    </span>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "11px", padding: "3px 8px" }}
                      onClick={resetAllColors}
                    >
                      Reset All
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {appList.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "var(--color-background-secondary)",
                          border: "1px solid var(--color-border-secondary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="color"
                            value={colors[app.id] || "#1d4ed8"}
                            onChange={(e) => setColor(app.id, e.target.value)}
                            style={{
                              width: 24,
                              height: 24,
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              padding: 0,
                              background: "transparent",
                            }}
                          />
                          <span style={{ fontSize: "12px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                            {app.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: "10.5px", padding: "2px 6px" }}
                          onClick={() => resetColor(app.id)}
                        >
                          Reset
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. EDITOR TAB */}
            {activeTab === "editor" && (
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                  Editor & Formatting
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                  Configure typography, line spacing, and code editor behavior.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Font Size */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Base font size</span>
                    <div className="claude-segmented-control">
                      {[12, 14, 16, 18].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`claude-segmented-btn ${editorFontSize === sz ? "active" : ""}`}
                          onClick={() => setEditorFontSize && setEditorFontSize(sz)}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Spacing */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>Line spacing</span>
                    <div className="claude-segmented-control">
                      {["1.4", "1.6", "1.8"].map((lh) => (
                        <button
                          key={lh}
                          type="button"
                          className={`claude-segmented-btn ${editorLineHeight === lh ? "active" : ""}`}
                          onClick={() => setEditorLineHeight && setEditorLineHeight(lh)}
                        >
                          {lh === "1.4" ? "Compact" : lh === "1.6" ? "Normal" : "Relaxed"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Word Wrap */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Word wrapping
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Wrap text lines automatically in source code and studio views.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={editorWordWrap}
                        onChange={(e) => setEditorWordWrap && setEditorWordWrap(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>

                  {/* Bracket Auto-Pair */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Auto-close brackets & quotes
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Automatically insert closing syntax pairs while typing.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={autoPair}
                        onChange={(e) => setAutoPair(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>

                  {/* Line Numbers */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Show line numbers
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Display left margin line numbers in code and HTML editor views.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={lineNumbers}
                        onChange={(e) => setLineNumbers(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CANVAS TAB */}
            {activeTab === "canvas" && (
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                  Canvas & Layout Guides
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                  Settings for HTML Studio, Presentation slides, and Vector Design workspaces.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* Grid */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Show background grid
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Render subtle alignment dot grid on document and slide canvases.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={canvasGrid}
                        onChange={(e) => setCanvasGrid && setCanvasGrid(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>

                  {/* Snap */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Snap to grid (8px)
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Snap elements to 8px increments when moving or resizing.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={canvasSnap}
                        onChange={(e) => setCanvasSnap && setCanvasSnap(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>

                  {/* Rulers */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Physical document rulers
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Show top measurement ruler bar in Word and HTML Studio.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={canvasRulers}
                        onChange={(e) => setCanvasRulers && setCanvasRulers(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>

                  {/* Units */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        Measurement units
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Physical dimension standard.
                      </span>
                    </div>
                    <select
                      className="claude-select"
                      style={{ minWidth: "150px" }}
                      value={canvasUnits}
                      onChange={(e) => setCanvasUnits(e.target.value)}
                    >
                      <option value="mm">Millimeters (mm)</option>
                      <option value="px">Pixels (px)</option>
                      <option value="in">Inches (in)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SHORTCUTS TAB */}
            {activeTab === "shortcuts" && (
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                  Keyboard Shortcuts
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                  Quick desktop navigation and document editing commands.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { action: "Save current document", key: "Ctrl + S" },
                    { action: "Open document file", key: "Ctrl + O" },
                    { action: "New blank document", key: "Ctrl + N" },
                    { action: "Undo last edit", key: "Ctrl + Z" },
                    { action: "Redo last edit", key: "Ctrl + Y" },
                    { action: "Close modal / dialog", key: "Escape" },
                    { action: "Open Settings", key: "Ctrl + ," },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "var(--color-background-secondary)",
                        border: "1px solid var(--color-border-secondary)",
                      }}
                    >
                      <span style={{ fontSize: "12.5px", color: "var(--color-text-primary)" }}>{s.action}</span>
                      <kbd
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "var(--color-background-primary)",
                          border: "1px solid var(--color-border-secondary)",
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. PERFORMANCE TAB */}
            {activeTab === "performance" && (
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                  Performance
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
                  Rendering acceleration and client memory optimizations.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)", display: "block" }}>
                        GPU Hardware Acceleration
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                        Accelerate canvas rendering and glass blur shaders via WebGL.
                      </span>
                    </div>
                    <label className="claude-toggle">
                      <input
                        type="checkbox"
                        checked={hardwareAcceleration}
                        onChange={(e) => setHardwareAcceleration && setHardwareAcceleration(e.target.checked)}
                      />
                      <span className="claude-toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 7. ABOUT TAB */}
            {activeTab === "about" && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "10px",
                    background: "var(--color-background-secondary)",
                    border: "1px solid var(--color-border-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    color: "var(--color-accent, #1d4ed8)",
                  }}
                >
                  <SettingsIcon size={22} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                  Liberty Studio Suite
                </h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "block", marginBottom: "16px" }}>
                  Version v0.0.0.1.0 • Desktop Edition
                </span>
                <p style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.5 }}>
                  A unified document, presentation, spreadsheet, and HTML authoring suite designed with an authoritative, restrained Claude/Liberty aesthetic.
                </p>

                <div style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: "12px", padding: "5px 14px" }}
                    onClick={onClose}
                  >
                    Close Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
