import { useState, useEffect } from "react";
import "../office/office.css";
import "../office/host.css";
import { useAppStore, useDocumentStore, useTheme, useKeyboard, useFileManager, type AppId } from "@liberty/shared-hooks";
import { AppShell, AppSidebar, StatusBar, BackstageSettings, LibertyDesignApp } from "@liberty/ui";
import { LibertyWriteApp } from "./apps/LibertyWriteApp";
import { LibertySheetApp } from "./apps/LibertySheetApp";
import { LibertyImpressApp } from "./apps/LibertyImpressApp";
import { LibertyPdfApp } from "./apps/LibertyPdfApp";
import { LibertyHtmlApp } from "./apps/LibertyHtmlApp";
import { LibertyFileDialog } from "./shell/LibertyFileDialog";

/**
 * LibertyStudio — The React-based suite orchestrator matching the OfficeSuite visual spec.
 * Uses the exact CSS classes and HTML structures of OfficeSuite.
 */
export default function LibertyStudio() {
  const activeApp = useAppStore((s) => s.activeApp);
  const setActiveApp = useAppStore((s) => s.setActiveApp);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const { save } = useFileManager();

  // App-specific active tabs
  const [writeTab, setWriteTab] = useState("home");
  const [sheetTab, setSheetTab] = useState("sheet-home");
  const [impressTab, setImpressTab] = useState("impress-home");
  const [pdfTab, setPdfTab] = useState("pdf-home");
  const [htmlTab, setHtmlTab] = useState("home");
  const [designTab, setDesignTab] = useState("design-draw");

  useTheme();

  // Load layout-basic to match the reference visual design style by default
  useEffect(() => {
    const body = document.body;
    if (!body.classList.contains("layout-basic") && !body.classList.contains("layout-liquid-glass")) {
      body.classList.add("layout-basic");
    }
    // Also make sure correct app classes are added to body for coloring
    body.classList.remove("app-word", "app-sheet", "app-impress", "app-pdf", "app-design", "app-html", "app-converter");
    if (activeApp === "write") body.classList.add("app-word");
    else if (activeApp === "sheet") body.classList.add("app-sheet");
    else if (activeApp === "present") body.classList.add("app-impress");
    else if (activeApp === "pdf") body.classList.add("app-pdf");
    else if (activeApp === "design") body.classList.add("app-design");
    else if (activeApp === "html") body.classList.add("app-html");
    else if (activeApp === "converter") body.classList.add("app-converter");
  }, [activeApp]);

  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("liberty-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      if (activeApp === "write") d.setWriteHtml("");
      if (activeApp === "sheet") d.setSheet({});
      if (activeApp === "html") d.setHtmlDoc("");
      d.setDirty(false);
    },
  });

  const renderActiveApp = () => {
    switch (activeApp) {
      case "write":
        return (
          <LibertyWriteApp
            activeTab={writeTab}
            setActiveTab={setWriteTab}
            onSave={save}
            onUndo={() => document.execCommand("undo")}
            onRedo={() => document.execCommand("redo")}
          />
        );
      case "sheet":
        return (
          <LibertySheetApp
            activeTab={sheetTab}
            setActiveTab={setSheetTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
        );
      case "present":
        return (
          <LibertyImpressApp
            activeTab={impressTab}
            setActiveTab={setImpressTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
        );
      case "pdf":
        return (
          <LibertyPdfApp
            activeTab={pdfTab}
            setActiveTab={setPdfTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
        );
      case "design":
        return (
          <LibertyDesignApp
            activeTab={designTab}
            setActiveTab={setDesignTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
        );
      case "html":
        return (
          <LibertyHtmlApp
            activeTab={htmlTab}
            setActiveTab={setHtmlTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
        );
      case "converter":
        return (
          <div style={{ padding: "48px 24px", maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>
              Universal Document Converter
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
              Interchange files between Word, Presentation slides, Spreadsheets, PDF, and HTML Studio formats.
            </p>
            <div
              style={{
                border: "2px dashed var(--color-border-secondary)",
                borderRadius: "12px",
                padding: "48px 24px",
                background: "var(--color-background-primary)",
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "16px", color: "var(--color-text-primary)" }}>
                Select an application workspace to import or convert into:
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                <button className="btn" style={{ padding: "8px 16px" }} onClick={() => setActiveApp("write")}>
                  Open in Docs (.docx)
                </button>
                <button className="btn" style={{ padding: "8px 16px" }} onClick={() => setActiveApp("html")}>
                  Open in HTML Studio (.html)
                </button>
                <button className="btn" style={{ padding: "8px 16px" }} onClick={() => setActiveApp("pdf")}>
                  Open in PDF Viewer (.pdf)
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="omega-suite-root">
      <AppShell
        sidebar={
          <AppSidebar
            activeApp={activeApp}
            onChangeApp={(app) => setActiveApp(app)}
          />
        }
        ribbon={null} // Ribbon is rendered inside each app component to keep tab bindings self-contained
        content={renderActiveApp()}
        statusBar={<StatusBar activeApp={activeApp} />}
      />
      {settingsOpen && <BackstageSettings onClose={() => toggleSettings(false)} />}
      <LibertyFileDialog />
    </div>
  );
}
