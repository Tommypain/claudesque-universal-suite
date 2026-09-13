import { useAppStore, type AppId } from "@liberty/shared-hooks";
import { WordIcon, ImpressIcon, SheetIcon, PdfIcon, DesignIcon, HtmlIcon, ConverterIcon } from "@liberty/icons";

interface AppSidebarProps {
  activeApp: AppId;
  onChangeApp: (app: AppId) => void;
}

/**
 * AppSidebar — left sidebar app switcher matching OfficeSuite's HTML
 * and CSS class names (`.app-sidebar` and `.app-icon-btn`).
 * Exactly 7 native sibling applications in the Liberty Studio ecosystem:
 * Documents, Presentations, Spreadsheets, PDF, Converter, Design, HTML Studio.
 */
export function AppSidebar({ activeApp, onChangeApp }: AppSidebarProps) {
  return (
    <div className="app-sidebar">
      <div className="sidebar-brand" title="Liberty Studio">🐙</div>
      
      <button 
        className={`app-icon-btn ${activeApp === "write" ? "active" : ""}`}
        onClick={() => onChangeApp("write")} 
        title="Documents (Word)"
      >
        <WordIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Docs</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "present" ? "active" : ""}`}
        onClick={() => onChangeApp("present")} 
        title="Presentations (Impress)"
      >
        <ImpressIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Slides</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "sheet" ? "active" : ""}`}
        onClick={() => onChangeApp("sheet")} 
        title="Spreadsheets (Sheet)"
      >
        <SheetIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Sheets</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "pdf" ? "active" : ""}`}
        onClick={() => onChangeApp("pdf")} 
        title="PDF Annotation & Sign"
      >
        <PdfIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>PDF</span>
      </button>

      <button 
        className={`app-icon-btn ${activeApp === "converter" ? "active" : ""}`}
        onClick={() => onChangeApp("converter")} 
        title="Universal File Converter"
      >
        <ConverterIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Convert</span>
      </button>

      <button 
        className={`app-icon-btn ${activeApp === "design" ? "active" : ""}`}
        onClick={() => onChangeApp("design")} 
        title="Vector Design Studio"
      >
        <DesignIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Design</span>
      </button>

      <div style={{ height: 1, margin: "6px 12px", background: "var(--color-border-tertiary)" }} />

      <button 
        className={`app-icon-btn ${activeApp === "html" ? "active" : ""}`}
        onClick={() => onChangeApp("html")} 
        title="HTML Studio — Visual & Code Document Authoring"
        style={{
          border: activeApp === "html" ? "1px solid var(--app-html, #0284c7)" : undefined,
        }}
      >
        <HtmlIcon size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, color: "var(--app-html, #0284c7)" }} />
        <span style={{ fontWeight: 600 }}>HTML</span>
      </button>
    </div>
  );
}
