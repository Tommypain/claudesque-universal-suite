import { Search, ZoomIn, ZoomOut } from "lucide-react";
import { useDocumentStore } from "../../store/useDocumentStore";
import { useAppStore, type AppId } from "../../store/useAppStore";

interface StatusBarProps {
  activeApp: AppId | "chat";
}

/**
 * StatusBar — Renders the status bar at the bottom matching the OfficeSuite visual styles
 * (`.status-bar`, `.status-left`, `.status-right`).
 */
export function StatusBar({ activeApp }: StatusBarProps) {
  const fileName = useDocumentStore((s) => s.fileName);
  const slides = useDocumentStore((s) => s.slides);
  const currentSlide = useDocumentStore((s) => s.currentSlide);
  const writeHtml = useDocumentStore((s) => s.writeHtml);
  
  // Word stats
  const getWordCount = () => {
    if (!writeHtml) return 0;
    const text = writeHtml.replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  };

  const getStatsText = () => {
    switch (activeApp) {
      case "write":
        return `Pages: 1 of 1 | Words: ${getWordCount()}`;
      case "sheet":
        return "Sheet: Active";
      case "present":
        return `Slide ${currentSlide + 1} of ${slides.length}`;
      case "pdf":
        return "PDF: View Mode";
      case "chat":
        return "AI Copilot: Connected";
      default:
        return "";
    }
  };

  const getAppLabel = () => {
    switch (activeApp) {
      case "write": return "WORD Workspace Active";
      case "sheet": return "SHEET Workspace Active";
      case "present": return "IMPRESS Workspace Active";
      case "pdf": return "PDF Workspace Active";
      case "chat": return "AI Chat Workspace Active";
      default: return "";
    }
  };

  return (
    <div className="status-bar" role="status">
      <div className="status-left">
        <span id="status-document-info" style={{ fontWeight: 600 }}>{getAppLabel()}</span>
        <div className="qs" />
        <span id="status-stats">{getStatsText()}</span>
      </div>
      <div className="status-right">
        <span>Accessibility: Multi-Page Engine v3.5 (Fully Functional)</span>
        <div className="qs" />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ZoomOut size={14} style={{ cursor: "pointer", opacity: 0.7 }} />
          <span id="status-zoom-val">100%</span>
          <ZoomIn size={14} style={{ cursor: "pointer", opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
}
