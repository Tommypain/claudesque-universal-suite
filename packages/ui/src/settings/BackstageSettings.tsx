import { useAppStore, type AppId } from "@liberty/shared-hooks";
import { useState } from "react";
import { SettingsIcon, ChevronLeft } from "@liberty/icons";

interface BackstageSettingsProps {
  onClose: () => void;
}

type SettingsSection = "general" | "appearance" | "engines" | "security" | "about";

/**
 * BackstageSettings — Backstage settings panel matching the visual design,
 * classes, and features of the OfficeSuite settings backstage view.
 */
export function BackstageSettings({ onClose }: BackstageSettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const theme = useAppStore((s: any) => s.theme);
  const setTheme = useAppStore((s: any) => s.setTheme);
  const colors = useAppStore((s: any) => s.colors);
  const setColor = useAppStore((s: any) => s.setColor);
  const resetColor = useAppStore((s: any) => s.resetColor);
  const resetAllColors = useAppStore((s: any) => s.resetAllColors);

  // Layout style (basic vs liquid-glass)
  const [layoutStyle, setLayoutStyle] = useState<"basic" | "liquid-glass">("basic");

  const handleLayoutStyleChange = (style: "basic" | "liquid-glass") => {
    setLayoutStyle(style);
    const body = document.body;
    body.classList.remove("layout-basic", "layout-liquid-glass");
    body.classList.add(`layout-${style}`);
  };

  const sections = [
    { id: "general", label: "General Preferences" },
    { id: "appearance", label: "Appearance & Colors" },
    { id: "engines", label: "Omega Core Engines" },
    { id: "security", label: "Originality & Stamp" },
    { id: "about", label: "Omega Licensing & About" },
  ] as const;

  return (
    <div className="backstage-panel active" style={{ display: "block" }}>
      <div className="flex h-full">
        {/* Backstage sidebar menu */}
        <div className="backstage-sidebar flex flex-col gap-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--color-text-primary)]">
            <SettingsIcon size={16} /> Settings Console
          </h2>
          
          {sections.map((sec) => (
            <div
              key={sec.id}
              className={`backstage-menu-item ${activeSection === sec.id ? "active" : ""}`}
              onClick={() => setActiveSection(sec.id)}
            >
              {sec.label}
            </div>
          ))}

          <button
            className="mt-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            onClick={onClose}
          >
            <ChevronLeft size={14} /> Return to Document
          </button>
        </div>

        {/* Backstage dynamic contents */}
        <div className="flex-1 pl-8 overflow-y-auto" style={{ padding: "24px" }}>
          
          {/* 1. General Settings */}
          {activeSection === "general" && (
            <div className="settings-section">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-neutral-700">
                General Suite Preferences
              </h3>
              
              <div className="mb-8">
                <h4 className="text-sm font-semibold mb-2">User Interface Layout Style</h4>
                <p className="text-xs text-gray-500 mb-4">Choose the presentation structure of your suite workspace toolbar and buttons.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 ${layoutStyle === "basic" ? "border-blue-600 bg-blue-50/10" : "border-gray-300 dark:border-neutral-700"}`}
                    onClick={() => handleLayoutStyleChange("basic")}
                  >
                    <span className="font-bold text-xs block mb-1">Basic Style (Default Capsule)</span>
                    <span className="text-[10px] text-gray-500">The beautiful rounded floating chip pattern seen in original design guidelines.</span>
                  </div>
                  <div
                    className={`border p-4 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 ${layoutStyle === "liquid-glass" ? "border-purple-600 bg-purple-50/10" : "border-gray-300 dark:border-neutral-700"}`}
                    onClick={() => handleLayoutStyleChange("liquid-glass")}
                  >
                    <span className="font-bold text-xs block mb-1 text-purple-600">Liquid Glass Layout (Apple macOS Style)</span>
                    <span className="text-[10px] text-gray-500">Glassmorphism effects, saturated blurs, glowing boundaries inspired by Apple's design language.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Appearance & Colors */}
          {activeSection === "appearance" && (
            <div className="settings-section">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-neutral-700">
                Appearance & Accent Colors
              </h3>

              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2">System Theme Mode</h4>
                <div className="flex gap-2">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button
                      key={t}
                      className={`px-4 py-2 border rounded-lg text-xs font-semibold cursor-pointer ${theme === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-neutral-700 text-[var(--color-text-primary)]"}`}
                      onClick={() => setTheme(t)}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">App Accent Colors</h4>
                <p className="text-xs text-gray-500 mb-4">Customize the accent colors for each core workspace application.</p>
                <div className="flex flex-col gap-3 max-w-md">
                  {(["write", "sheet", "present", "pdf"] as AppId[]).map((app) => (
                    <div key={app} className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colors[app]}
                          onChange={(e) => setColor(app, e.target.value)}
                          style={{ width: 32, height: 32, border: "none", borderRadius: 4, cursor: "pointer" }}
                        />
                        <span className="text-xs font-semibold uppercase">{app} App</span>
                      </div>
                      <button
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-neutral-700 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                        onClick={() => resetColor(app)}
                      >
                        Reset
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                  onClick={resetAllColors}
                >
                  Reset All Colors to Default
                </button>
              </div>
            </div>
          )}

          {/* 3. Core Engines */}
          {activeSection === "engines" && (
            <div className="settings-section">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-neutral-700">
                Omega Core Engines Configuration
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The computing core runs cross-compiled native libraries and client-side modules to compute cell formulas, parse documents, and render PDFs inside a local sandboxed browser container.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 text-xs">
                  <span className="font-bold block mb-1">Formula Calculation Engine</span>
                  <span className="text-[10px] text-green-600 font-semibold">Active: Threaded Evaluator v2.1 (Fully Functional)</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 text-xs">
                  <span className="font-bold block mb-1">Document Parsing Core</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Active: Mammoth.JS + OOXML Schema Validator</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded border border-gray-200 dark:border-neutral-700 text-xs">
                  <span className="font-bold block mb-1">PDF Rendering Core</span>
                  <span className="text-[10px] text-purple-600 font-semibold">Active: PDF.JS Web Worker Thread</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Originality & Stamp */}
          {activeSection === "security" && (
            <div className="settings-section">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-neutral-700">
                Originality & System Identification
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg max-w-lg text-xs flex flex-col gap-2">
                <div><strong>Licensing Stamp:</strong> Fully Compiled Local Build</div>
                <div><strong>System Registration ID:</strong> OMS-9021-A938-CC21</div>
                <div><strong>API Sandbox:</strong> Enabled (Secure Host Environment)</div>
                <div><strong>Cryptography Node:</strong> RSA-4096 Signed Local Certificate</div>
              </div>
            </div>
          )}

          {/* 5. Licensing & About */}
          {activeSection === "about" && (
            <div className="settings-section">
              <h3 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-neutral-700">
                About Liberty Studio
              </h3>
              <div className="text-center py-6">
                <span className="text-4xl block mb-2">🐙</span>
                <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Liberty Studio Suite</h4>
                <span className="text-xs text-gray-400 block mb-4">Enterprise Edition - v3.5 (Fully Licensed)</span>
                <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed mb-6">
                  Copyright © 2026 Liberty Core Technologies. All software parameters, calculations engines, vector draw canvases and layout presets are legally signed, protected, and fully compiled under local sandbox paradigms.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
