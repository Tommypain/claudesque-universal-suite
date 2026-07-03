import { useState, type ReactNode } from "react";
import { Save, Undo2, Redo2, Printer, FolderOpen, Sun, Moon, Search, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export interface RibbonTabDef {
  id: string;
  label: string;
  content: ReactNode;
}

interface RibbonProps {
  tabs: RibbonTabDef[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPrint?: () => void;
}

/**
 * Ribbon — The universal OfficeSuite ribbon containing the QAT (Quick Access Toolbar),
 * the tab switcher row, and the groups body.
 */
export function Ribbon({
  tabs,
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
  onPrint,
}: RibbonProps) {
  const [collapsed, setCollapsed] = useState(false);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const toggleSettings = useAppStore((s) => s.toggleSettings);

  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleToggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`ribbon-system ${collapsed ? "collapsed" : ""}`}>
      {/* Quick Access Toolbar (QAT) */}
      <div className="qat" style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button 
            className="qb" 
            title="Open File (Ctrl+O)" 
            onClick={() => window.dispatchEvent(new Event("liberty-open"))}
            style={{ color: "#7c3aed" }}
          >
            <FolderOpen size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
          </button>
          {onSave && (
            <button className="qb text-green-600" title="Save (Ctrl+S)" onClick={onSave}>
              <Save size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            </button>
          )}
          {onUndo && (
            <button className="qb" title="Undo (Ctrl+Z)" onClick={onUndo}>
              <Undo2 size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            </button>
          )}
          {onRedo && (
            <button className="qb" title="Redo (Ctrl+Y)" onClick={onRedo}>
              <Redo2 size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            </button>
          )}
          {onPrint && (
            <button className="qb" title="Print Document" onClick={onPrint}>
              <Printer size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            </button>
          )}
          <div className="qs" />
          <button className="qb" title="More Quick Access Options">
            <ChevronDown size={12} style={{ display: "inline-block", verticalAlign: "middle" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button 
            className="qb" 
            id="dark-mode-toggle" 
            title="Toggle Dark/Light Mode" 
            onClick={handleToggleDarkMode}
          >
            {theme === "dark" ? (
              <Sun size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            ) : (
              <Moon size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            )}
          </button>
          <button className="qb text-amber-600" title="Find & Replace">
            <Search size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
          </button>
          <button 
            className="qb text-blue-600" 
            title="Liberty Suite Preferences" 
            onClick={() => toggleSettings(true)}
          >
            <Settings size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
          </button>
          <div className="qs" />
          <button 
            className="qb" 
            title={collapsed ? "Expand Ribbon" : "Collapse Ribbon"} 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronDown size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            ) : (
              <ChevronUp size={14} style={{ display: "inline-block", verticalAlign: "middle" }} />
            )}
          </button>
        </div>
      </div>

      {/* Ribbon tabs row */}
      {!collapsed && (
        <>
          <div className="tbar" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`tb ${t.id === activeTab ? "a" : ""}`}
                role="tab"
                aria-selected={t.id === activeTab}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ribbon body with active tab contents */}
          <div className="rbody-wrapper">
            <div className="rbody">
              {currentTab?.content}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
