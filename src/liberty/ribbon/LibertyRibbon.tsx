import { useState, type ReactNode } from "react";
import { Save, Undo2, Redo2 } from "lucide-react";

export interface LibertyRibbonTabDef {
  id: string;
  label: string;
  content: ReactNode;
}

interface LibertyRibbonProps {
  tabs: LibertyRibbonTabDef[];
  /** Whether to apply the glass-surface class (from ThemeContext) */
  glass?: boolean;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

/**
 * LibertyRibbon — the full Ribbon chrome used by all Liberty apps.
 *
 * Renders:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  QAT (Save, Undo, Redo)                             │
 *   │  [Home] [Insert] [Layout] …  (tab bar)              │
 *   │  ─────────────────────────────────────────────────  │
 *   │  (active tab ribbon body — groups + controls)        │
 *   └─────────────────────────────────────────────────────┘
 */
export function LibertyRibbon({ tabs, glass = false, onSave, onUndo, onRedo }: LibertyRibbonProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === activeId) ?? tabs[0];

  const ribbonClass = ["lib-ribbon-wrap", glass ? "glass-surface" : ""].filter(Boolean).join(" ");

  return (
    <div className={ribbonClass}>
      {/* Quick Access Toolbar */}
      <div className="lib-qat">
        {onSave && (
          <button className="lib-iconbtn" aria-label="Save (Ctrl+S)" onClick={onSave}>
            <Save size={14} />
          </button>
        )}
        {onUndo && (
          <button className="lib-iconbtn" aria-label="Undo (Ctrl+Z)" onClick={onUndo}>
            <Undo2 size={14} />
          </button>
        )}
        {onRedo && (
          <button className="lib-iconbtn" aria-label="Redo (Ctrl+Y)" onClick={onRedo}>
            <Redo2 size={14} />
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="lib-tabbar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            className="lib-tab"
            role="tab"
            aria-selected={t.id === current?.id}
            onClick={() => setActiveId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ribbon body */}
      <div className="lib-ribbon">{current?.content}</div>
    </div>
  );
}
