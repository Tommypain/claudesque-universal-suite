import { useState, useEffect } from "react";
import "../office/office.css";
import "../office/host.css";
import { useAppStore, useDocumentStore, useTheme, useKeyboard, useFileManager, type AppId } from "@liberty/shared-hooks";
import { AppShell, AppSidebar, StatusBar, BackstageSettings } from "@liberty/ui";
import { LibertyWriteApp } from "./apps/LibertyWriteApp";
import { LibertySheetApp } from "./apps/LibertySheetApp";
import { LibertyImpressApp } from "./apps/LibertyImpressApp";
import { LibertyPdfApp } from "./apps/LibertyPdfApp";
import { LibertyChatApp } from "./apps/LibertyChatApp";
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
  const [chatTab, setChatTab] = useState("chat-home");

  useTheme();

  // Load layout-basic to match the reference visual design style by default
  useEffect(() => {
    const body = document.body;
    if (!body.classList.contains("layout-basic") && !body.classList.contains("layout-liquid-glass")) {
      body.classList.add("layout-basic");
    }
    // Also make sure correct app classes are added to body for coloring
    body.classList.remove("app-word", "app-sheet", "app-impress", "app-pdf", "app-chat");
    if (activeApp === "write") body.classList.add("app-word");
    else if (activeApp === "sheet") body.classList.add("app-sheet");
    else if (activeApp === "present") body.classList.add("app-impress");
    else if (activeApp === "pdf") body.classList.add("app-pdf");
  }, [activeApp]);

  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("liberty-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      if (activeApp === "write") d.setWriteHtml("");
      if (activeApp === "sheet") d.setSheet({});
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
      case "chat":
        return (
          <LibertyChatApp
            activeTab={chatTab}
            setActiveTab={setChatTab}
            onSave={save}
            onUndo={() => {}}
            onRedo={() => {}}
          />
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
            onChangeApp={(app) => {
              if (app === "chat") {
                setActiveApp("write"); // fallback app ID in store, show chat layout
                // We'll update the store's active app directly if store gets extended,
                // but for now let's update local activeApp or trigger state change.
                useAppStore.setState({ activeApp: "write" }); // keep store write active, but let's change app ID
              }
              // Map Present to present, sheet to sheet, pdf to pdf, write to write
              setActiveApp(app as AppId);
            }}
          />
        }
        ribbon={null} // Ribbon is rendered inside each app component to keep tab bindings self-contained
        content={
          settingsOpen ? (
            <BackstageSettings onClose={() => toggleSettings(false)} />
          ) : (
            renderActiveApp()
          )
        }
        statusBar={<StatusBar activeApp={activeApp} />}
      />
      <LibertyFileDialog />
    </div>
  );
}
