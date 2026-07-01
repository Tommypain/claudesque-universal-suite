import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  FileText,
  Grid3x3,
  Presentation,
  FileType2,
  MessageSquare,
  Save,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Baseline,
  PanelLeft,
  PanelRight,
  Settings2,
  X,
  Image,
  Table,
  Shapes,
  Ruler,
  Columns3,
  BookMarked,
  Quote,
  MessageCircle,
  Check,
  Search,
  ZoomIn,
} from "lucide-react";
import "./theme.css";
import { ThemeProvider, useTheme, type ThemeName } from "./ThemeContext";

/* ---------------- Static mock data ---------------- */

interface AppDef {
  id: string;
  label: string;
  icon: typeof FileText;
}

const APPS: AppDef[] = [
  { id: "write", label: "Write", icon: FileText },
  { id: "sheet", label: "Sheet", icon: Grid3x3 },
  { id: "impress", label: "Impress", icon: Presentation },
  { id: "pdf", label: "PDF Edit", icon: FileType2 },
];
const CHAT_APP: AppDef = { id: "chat", label: "Chat", icon: MessageSquare };

const TABS = ["Home", "Insert", "Layout", "References", "Review", "View"] as const;
type TabName = (typeof TABS)[number];

const FONTS = ["Calibri", "Georgia", "Times New Roman", "Arial", "Cambria"];
type ThumbSize = "Small" | "Medium" | "Large";
const THUMB_DIMS: Record<ThumbSize, { w: number; h: number }> = {
  Small: { w: 96, h: 128 },
  Medium: { w: 150, h: 200 },
  Large: { w: 210, h: 280 },
};

const PARAGRAPHS = [
  "Liberty Studio is a browser-native productivity suite designed for people who want power without compromise. Every document, spreadsheet, and presentation lives in one calm, focused workspace that adapts to the way you work.",
  "The interface is built around a familiar ribbon, so the tools you reach for most are always a single click away. Formatting, layout, and review controls are grouped logically and stay out of the way until you need them.",
  "This is a static visual foundation — a faithful shell ready to be wired to real editing functionality. Switch themes, resize thumbnails, and explore the tabs to feel how the finished product will behave.",
];

/* ---------------- Small building blocks ---------------- */

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="lib-group">
      <div className="lib-group-body">{children}</div>
      <div className="lib-group-label">{label}</div>
    </div>
  );
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right" | "justify";
}

/* ---------------- Ribbon per tab ---------------- */

function HomeRibbon({
  format,
  setFormat,
  fontSize,
  setFontSize,
}: {
  format: FormatState;
  setFormat: (f: FormatState) => void;
  fontSize: number;
  setFontSize: (n: number) => void;
}) {
  const aligns: { key: FormatState["align"]; icon: typeof AlignLeft }[] = [
    { key: "left", icon: AlignLeft },
    { key: "center", icon: AlignCenter },
    { key: "right", icon: AlignRight },
    { key: "justify", icon: AlignJustify },
  ];
  return (
    <>
      <Group label="Font">
        <select className="lib-select" defaultValue={FONTS[0]} aria-label="Font family">
          {FONTS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <div className="lib-stepper">
          <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} aria-label="Decrease font size">
            −
          </button>
          <input value={fontSize} readOnly aria-label="Font size" />
          <button onClick={() => setFontSize(Math.min(96, fontSize + 1))} aria-label="Increase font size">
            +
          </button>
        </div>
        <button
          className={"lib-ctrl" + (format.bold ? " pressed" : "")}
          aria-pressed={format.bold}
          onClick={() => setFormat({ ...format, bold: !format.bold })}
        >
          <Bold size={15} />
        </button>
        <button
          className={"lib-ctrl" + (format.italic ? " pressed" : "")}
          aria-pressed={format.italic}
          onClick={() => setFormat({ ...format, italic: !format.italic })}
        >
          <Italic size={15} />
        </button>
        <button
          className={"lib-ctrl" + (format.underline ? " pressed" : "")}
          aria-pressed={format.underline}
          onClick={() => setFormat({ ...format, underline: !format.underline })}
        >
          <Underline size={15} />
        </button>
        <button className="lib-ctrl" aria-label="Text color">
          <Baseline size={15} />
          <span className="lib-swatch" />
        </button>
      </Group>

      <Group label="Paragraph">
        {aligns.map(({ key, icon: Icon }) => (
          <button
            key={key}
            className={"lib-ctrl" + (format.align === key ? " pressed" : "")}
            aria-pressed={format.align === key}
            onClick={() => setFormat({ ...format, align: key })}
          >
            <Icon size={15} />
          </button>
        ))}
        <button className="lib-ctrl" aria-label="Bullet list">
          <List size={15} />
        </button>
        <button className="lib-ctrl" aria-label="Numbered list">
          <ListOrdered size={15} />
        </button>
      </Group>

      <Group label="Styles">
        <button className="lib-ctrl">Normal</button>
        <button className="lib-ctrl">Heading 1</button>
        <button className="lib-ctrl">Heading 2</button>
        <button className="lib-ctrl">Title</button>
      </Group>

      <Group label="Editing">
        <button className="lib-ctrl">
          <Search size={15} /> Find
        </button>
        <button className="lib-ctrl">Replace</button>
        <button className="lib-ctrl">Select</button>
      </Group>
    </>
  );
}

function PlaceholderRibbon({ groups }: { groups: { label: string; items: string[] }[] }) {
  return (
    <>
      {groups.map((g) => (
        <Group key={g.label} label={g.label}>
          {g.items.map((it) => (
            <button key={it} className="lib-ctrl">
              {it}
            </button>
          ))}
        </Group>
      ))}
    </>
  );
}

const OTHER_TABS: Record<Exclude<TabName, "Home">, { label: string; items: string[] }[]> = {
  Insert: [
    { label: "Media", items: ["Picture", "Shapes", "Table"] },
    { label: "Text", items: ["Text Box", "Header"] },
    { label: "Links", items: ["Link", "Bookmark"] },
  ],
  Layout: [
    { label: "Page Setup", items: ["Margins", "Orientation", "Size"] },
    { label: "Arrange", items: ["Columns", "Position"] },
  ],
  References: [
    { label: "Contents", items: ["Table of Contents", "Footnote"] },
    { label: "Citations", items: ["Citation", "Bibliography"] },
  ],
  Review: [
    { label: "Proofing", items: ["Spelling", "Thesaurus"] },
    { label: "Comments", items: ["New Comment", "Delete"] },
  ],
  View: [
    { label: "Views", items: ["Read", "Print", "Web"] },
    { label: "Zoom", items: ["Zoom", "100%"] },
  ],
};

/* icon hints for a couple of Insert items to add polish (kept simple) */
void Image;
void Shapes;
void Table;
void Ruler;
void Columns3;
void BookMarked;
void Quote;
void MessageCircle;
void ZoomIn;

/* ---------------- Settings panel (draggable) ---------------- */

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, blur, setBlur, opacity, setOpacity, wallpaper, setWallpaper, isGlass } =
    useTheme();
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: window.innerWidth - 360,
    y: 90,
  }));
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.min(Math.max(0, e.clientX - drag.current.dx), window.innerWidth - 320);
    const y = Math.min(Math.max(0, e.clientY - drag.current.dy), window.innerHeight - 80);
    setPos({ x, y });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const presets: { id: ThemeName; label: string; preview: string }[] = [
    { id: "solid", label: "Solid", preview: "lib-preview-solid" },
    { id: "glass-light", label: "Glass Light", preview: "lib-preview-glass-light" },
    { id: "glass-dark", label: "Glass Dark", preview: "lib-preview-glass-dark" },
  ];

  return (
    <div
      className="lib-settings glass-surface"
      style={{ left: pos.x, top: pos.y } as CSSProperties}
      role="dialog"
      aria-label="Theme settings"
    >
      <div
        className="lib-settings-head"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <Settings2 size={16} />
        <span>Appearance</span>
        <button
          className="lib-iconbtn"
          style={{ marginLeft: "auto" }}
          onClick={onClose}
          aria-label="Close settings"
        >
          <X size={15} />
        </button>
      </div>
      <div className="lib-settings-body">
        <div>
          <div className="lib-section-title">Theme</div>
          <div className="lib-theme-cards">
            {presets.map((p) => (
              <button
                key={p.id}
                className="lib-theme-card"
                aria-pressed={theme === p.id}
                onClick={() => setTheme(p.id)}
              >
                <div className={"lib-theme-preview " + p.preview}>
                  <span className="lib-preview-dot" />
                </div>
                {p.label}
                {theme === p.id ? <Check size={11} style={{ marginLeft: 3 }} /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={isGlass ? "" : "lib-disabled"}>
          <div className="lib-section-title">Glass</div>
          <div className="lib-slider-row">
            <label>
              <span>Blur Intensity</span>
              <span>{blur}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
            />
          </div>
          <div className="lib-slider-row">
            <label>
              <span>Opacity</span>
              <span>{opacity}%</span>
            </label>
            <input
              type="range"
              min={30}
              max={95}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </div>
          <div className="lib-toggle-row">
            <span>Cinematic Wallpaper Backdrop</span>
            <button
              className="lib-switch"
              aria-pressed={wallpaper}
              aria-label="Toggle wallpaper"
              onClick={() => setWallpaper(!wallpaper)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */

function Shell() {
  const { theme, blur, opacity, wallpaper, isGlass } = useTheme();
  const [activeApp, setActiveApp] = useState<string>("write");
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  const [appbarOpen, setAppbarOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thumbSize, setThumbSize] = useState<ThumbSize>("Medium");
  const [fontSize, setFontSize] = useState(11);
  const [format, setFormat] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  });

  const showWallpaper = isGlass && wallpaper;

  const rootStyle: CSSProperties = {
    // live glass controls resolve through these variables
    ["--glass-blur" as string]: `${blur}px`,
    ["--glass-alpha" as string]: `${opacity / 100}`,
  };

  const activeAppLabel =
    activeApp === "chat"
      ? CHAT_APP.label
      : (APPS.find((a) => a.id === activeApp)?.label ?? "Write");

  const glass = isGlass ? " glass-surface" : "";

  const dims = THUMB_DIMS[thumbSize];

  const renderRibbon = useCallback(() => {
    if (activeTab === "Home") {
      return (
        <HomeRibbon
          format={format}
          setFormat={setFormat}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />
      );
    }
    return <PlaceholderRibbon groups={OTHER_TABS[activeTab]} />;
  }, [activeTab, format, fontSize]);

  return (
    <div className="liberty-root" data-theme={theme} style={rootStyle}>
      {showWallpaper ? <div className="liberty-wallpaper" /> : null}

      <div className="liberty-shell">
        {/* Title bar */}
        <div className={"lib-titlebar" + glass}>
          <button
            className="lib-iconbtn"
            onClick={() => setAppbarOpen((v) => !v)}
            aria-label="Toggle app sidebar"
          >
            <PanelLeft size={15} />
          </button>
          <span className="lib-title-brandbar" />
          <span className="lib-title-app">Liberty {activeAppLabel}</span>
          <span className="lib-title-sub">— Untitled document</span>
          <div className="lib-title-actions">
            <button
              className="lib-iconbtn"
              onClick={() => setRightOpen((v) => !v)}
              aria-label="Toggle right panel"
            >
              <PanelRight size={15} />
            </button>
          </div>
        </div>

        <div className="lib-body">
          {/* App switcher */}
          <nav className={"lib-appbar" + (appbarOpen ? "" : " collapsed") + glass} aria-label="Apps">
            {APPS.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  className="lib-appbtn"
                  aria-pressed={activeApp === app.id}
                  onClick={() => setActiveApp(app.id)}
                >
                  <Icon size={20} />
                  {app.label}
                </button>
              );
            })}
            <div className="lib-appbar-spacer" />
            <div className="lib-appbar-divider" />
            <button
              className="lib-appbtn"
              aria-pressed={activeApp === CHAT_APP.id}
              onClick={() => setActiveApp(CHAT_APP.id)}
            >
              <CHAT_APP.icon size={20} />
              {CHAT_APP.label}
            </button>
          </nav>

          {/* Main column */}
          <div className="lib-main">
            <div className={"lib-ribbon-wrap" + glass}>
              {/* QAT */}
              <div className="lib-qat">
                <button className="lib-iconbtn" aria-label="Save">
                  <Save size={14} />
                </button>
                <button className="lib-iconbtn" aria-label="Undo">
                  <Undo2 size={14} />
                </button>
                <button className="lib-iconbtn" aria-label="Redo">
                  <Redo2 size={14} />
                </button>
              </div>

              {/* Tabs */}
              <div className="lib-tabbar" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t}
                    className="lib-tab"
                    role="tab"
                    aria-selected={activeTab === t}
                    onClick={() => setActiveTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Ribbon body */}
              <div className="lib-ribbon">{renderRibbon()}</div>
            </div>

            {/* Canvas */}
            <div className="lib-canvas">
              <div className="lib-canvas-scroll">
                <article
                  className="lib-page"
                  style={{
                    fontWeight: format.bold ? 700 : 400,
                    fontStyle: format.italic ? "italic" : "normal",
                    textDecoration: format.underline ? "underline" : "none",
                    textAlign: format.align,
                    fontSize: `${fontSize + 3}px`,
                  }}
                >
                  <h1>Liberty {activeAppLabel}</h1>
                  <div className="lib-doc-sub">A visual foundation, ready to build on.</div>
                  {PARAGRAPHS.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </article>
              </div>

              {/* Right panel */}
              <aside
                className={"lib-rightpanel" + (rightOpen ? "" : " collapsed") + glass}
                aria-label="Thumbnails"
              >
                <div className="lib-rightpanel-head">
                  <div className="lib-segmented" role="group" aria-label="Thumbnail size">
                    {(["Small", "Medium", "Large"] as ThumbSize[]).map((s) => (
                      <button
                        key={s}
                        aria-pressed={thumbSize === s}
                        onClick={() => setThumbSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lib-thumbs">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="lib-thumb"
                      style={{ width: dims.w, height: dims.h }}
                    >
                      Page {n}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Settings FAB + panel */}
      <button
        className="lib-fab"
        onClick={() => setSettingsOpen((v) => !v)}
        aria-label="Open appearance settings"
      >
        <Settings2 size={22} />
      </button>
      {settingsOpen ? <SettingsPanel onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
}

export default function LibertyStudio() {
  useEffect(() => {
    document.documentElement.classList.remove("omega-host");
  }, []);
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
