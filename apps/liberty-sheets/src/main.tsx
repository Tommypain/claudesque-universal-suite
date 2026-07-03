import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";
import { useAppStore, useDocumentStore, useTheme, useKeyboard, useFileManager } from "@liberty/shared-hooks";
import { AppShell, AppSidebar, StatusBar, BackstageSettings, LibertySheetApp, LibertyFileDialog } from "@liberty/ui";

function SheetsApp() {
  const activeApp = useAppStore((s: any) => s.activeApp);
  const setActiveApp = useAppStore((s: any) => s.setActiveApp);
  const settingsOpen = useAppStore((s: any) => s.settingsOpen);
  const toggleSettings = useAppStore((s: any) => s.toggleSettings);
  const { save } = useFileManager();

  const [sheetTab, setSheetTab] = useState("sheet-home");

  // Run hooks
  useTheme();
  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("liberty-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      d.setSheet({});
      d.setDirty(false);
    },
  });

  // Force activeApp to sheet on startup
  useEffect(() => {
    setActiveApp("sheet");
  }, [setActiveApp]);

  return (
    <div className="omega-suite-root">
      <AppShell
        sidebar={
          <AppSidebar
            activeApp={activeApp}
            onChangeApp={(app) => {
              if (app !== "sheet") {
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
            <LibertySheetApp
              activeTab={sheetTab}
              setActiveTab={setSheetTab}
              onSave={save}
              onUndo={() => {}}
              onRedo={() => {}}
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
    <SheetsApp />
  </React.StrictMode>
);
