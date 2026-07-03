import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";
import { useAppStore, useDocumentStore, useTheme, useKeyboard, useFileManager } from "@liberty/shared-hooks";
import { AppShell, AppSidebar, StatusBar, BackstageSettings, LibertyImpressApp, LibertyFileDialog } from "@liberty/ui";

function ImpressApp() {
  const activeApp = useAppStore((s: any) => s.activeApp);
  const setActiveApp = useAppStore((s: any) => s.setActiveApp);
  const settingsOpen = useAppStore((s: any) => s.settingsOpen);
  const toggleSettings = useAppStore((s: any) => s.toggleSettings);
  const { save } = useFileManager();

  const [impressTab, setImpressTab] = useState("impress-home");

  // Run hooks
  useTheme();
  useKeyboard({
    onOpen: () => window.dispatchEvent(new Event("liberty-open")),
    onSave: () => save(),
    onNew: () => {
      const d = useDocumentStore.getState();
      d.setFileName("Untitled");
      d.setSlides([
        {
          id: Math.random().toString(36).slice(2),
          bg: "#ffffff",
          theme: "theme-plain",
          texts: [
            { id: "t1", x: 80, y: 80, html: "Click to add title" },
            { id: "t2", x: 80, y: 200, html: "Click to add text" },
          ],
        }
      ]);
      d.setCurrentSlide(0);
      d.setDirty(false);
    },
  });

  // Force activeApp to present on startup
  useEffect(() => {
    setActiveApp("present");
  }, [setActiveApp]);

  return (
    <div className="omega-suite-root">
      <AppShell
        sidebar={
          <AppSidebar
            activeApp={activeApp}
            onChangeApp={(app) => {
              if (app !== "present") {
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
            <LibertyImpressApp
              activeTab={impressTab}
              setActiveTab={setImpressTab}
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
    <ImpressApp />
  </React.StrictMode>
);
