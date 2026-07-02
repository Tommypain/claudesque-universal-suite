import "../octopus/octopus.css";
import { useAppStore } from "../store/useAppStore";
import { useDocumentStore } from "../store/useDocumentStore";
import { useTheme } from "../hooks/useTheme";
import { useKeyboard } from "../hooks/useKeyboard";
import { useFileManager } from "../hooks/useFileManager";
import { Sidebar } from "../components/shared/Sidebar";
import { StatusBar } from "../components/shared/StatusBar";
import { SettingsPanel } from "../components/shared/SettingsPanel";
import { Toast } from "../components/shared/Toast";
import { FileDialog } from "../components/shared/FileDialog";
import { WriteApp } from "../components/apps/WriteApp";
import { SheetApp } from "../components/apps/SheetApp";
import { PresentApp } from "../components/apps/PresentApp";
import { PdfApp } from "../components/apps/PdfApp";

export default function OctopusStudio() {
  const activeApp = useAppStore((s) => s.activeApp);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const fileName = useDocumentStore((s) => s.fileName);
  const dirty = useDocumentStore((s) => s.dirty);
  const { save } = useFileManager();

  useTheme();
  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("octopus-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      if (activeApp === "write") d.setWriteHtml("");
      if (activeApp === "sheet") d.setSheet({});
      d.setDirty(false);
    },
  });

  return (
    <div className="octopus-root">
      <Sidebar />
      <div className="oct-main">
        <div className="oct-titlebar">
          <span className="oct-title-name">Octopus Studio</span>
          <span style={{ color: "var(--text-2)" }}>—</span>
          <span>
            {fileName}
            {dirty ? <span className="oct-dirty"> •</span> : null}
          </span>
          <div className="oct-titlebar-spacer" />
          <button
            className="oct-icon-btn"
            title="Open (Ctrl+O)"
            onClick={() => window.dispatchEvent(new Event("octopus-open"))}
          >
            📂
          </button>
          <button className="oct-icon-btn" title="Save (Ctrl+S)" onClick={() => save()}>
            💾
          </button>
          <button className="oct-icon-btn" title="Settings" onClick={() => toggleSettings(true)}>
            ⚙
          </button>
        </div>

        {activeApp === "write" && <WriteApp />}
        {activeApp === "sheet" && <SheetApp />}
        {activeApp === "present" && <PresentApp />}
        {activeApp === "pdf" && <PdfApp />}

        <StatusBar />
      </div>

      <SettingsPanel />
      <Toast />
      <FileDialog />
    </div>
  );
}
