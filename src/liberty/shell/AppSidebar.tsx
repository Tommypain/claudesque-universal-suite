import { useAppStore, type AppId } from "../../store/useAppStore";
import { FileText, Presentation, Grid3x3, FileType2, MessageSquare } from "lucide-react";

interface AppSidebarProps {
  activeApp: AppId | "chat";
  onChangeApp: (app: AppId | "chat") => void;
}

/**
 * AppSidebar — left sidebar app switcher matching OfficeSuite's HTML
 * and CSS class names (`.app-sidebar` and `.app-icon-btn`).
 */
export function AppSidebar({ activeApp, onChangeApp }: AppSidebarProps) {
  return (
    <div className="app-sidebar">
      <div className="sidebar-brand" title="Liberty Studio">🐙</div>
      
      <button 
        className={`app-icon-btn ${activeApp === "write" ? "active" : ""}`}
        onClick={() => onChangeApp("write")} 
        title="Word Processor"
      >
        <FileText size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Word</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "present" ? "active" : ""}`}
        onClick={() => onChangeApp("present")} 
        title="Impress Presentation"
      >
        <Presentation size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Impress</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "sheet" ? "active" : ""}`}
        onClick={() => onChangeApp("sheet")} 
        title="Sheet Spreadsheet"
      >
        <Grid3x3 size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Sheet</span>
      </button>
      
      <button 
        className={`app-icon-btn ${activeApp === "pdf" ? "active" : ""}`}
        onClick={() => onChangeApp("pdf")} 
        title="PDF Annotation & Sign"
      >
        <FileType2 size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>PDF Edit</span>
      </button>

      <div style={{ flex: 1 }} />
      <div style={{ height: 1, margin: "4px 12px", background: "var(--color-border-tertiary)" }} />

      <button 
        className={`app-icon-btn ${activeApp === "chat" ? "active" : ""}`}
        onClick={() => onChangeApp("chat")} 
        title="Liberty AI Chat"
      >
        <MessageSquare size={14} style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }} />
        <span>Chat</span>
      </button>
    </div>
  );
}
