import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";
import { useAppStore, useDocumentStore, useTheme, useKeyboard, useFileManager } from "@liberty/shared-hooks";
import { AppShell, AppSidebar, StatusBar, BackstageSettings, LibertyWriteApp, LibertyFileDialog } from "@liberty/ui";

function DocsApp() {
  const activeApp = useAppStore((s: any) => s.activeApp);
  const setActiveApp = useAppStore((s: any) => s.setActiveApp);
  const settingsOpen = useAppStore((s: any) => s.settingsOpen);
  const toggleSettings = useAppStore((s: any) => s.toggleSettings);
  const { save } = useFileManager();

  const [writeTab, setWriteTab] = useState("home");

  // Run hooks
  useTheme();
  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("liberty-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      d.setWriteHtml("");
      d.setDirty(false);
    },
  });

  // Force activeApp to write on startup
  useEffect(() => {
    setActiveApp("write");
  }, [setActiveApp]);

  return (
    <div className="omega-suite-root">
      <AppShell
        sidebar={
          <AppSidebar
            activeApp={activeApp}
            onChangeApp={(app) => {
              if (app !== "write") {
                alert(`App "${app}" is available as a standalone workspace. Opening application...`);
              }
            }}
          />
        }
        ribbon={null}
        content={
          settingsOpen ? (
            <BackstageSettings onClose={() => toggleSettings(false)} />
          ) : (
            <LibertyWriteApp
              activeTab={writeTab}
              setActiveTab={setWriteTab}
              onSave={save}
              onUndo={() => document.execCommand("undo")}
              onRedo={() => document.execCommand("redo")}
            />
          )
        }
        statusBar={<StatusBar activeApp={activeApp} />}
      />
      <LibertyFileDialog />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DocsApp />
  </React.StrictMode>
);
