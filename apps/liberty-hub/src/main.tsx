import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";
import { 
  FileText, 
  Grid3x3, 
  Presentation, 
  FileType2, 
  PenTool, 
  Mic, 
  Plus, 
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle,
  Cpu
} from "lucide-react";

interface PluginDef {
  id: string;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  enabled: boolean;
}

const DEFAULT_PLUGINS: PluginDef[] = [
  {
    id: "ai-assistant",
    name: "AI Dictation Assistant",
    version: "1.0.4",
    description: "Autocompletes voice transcription texts using LLM hints.",
    permissions: ["network"],
    enabled: true,
  },
  {
    id: "formula-pack",
    name: "Engineering Formulas Pack",
    version: "2.1.0",
    description: "Adds 45+ specialized math & structural formulas to sheets.",
    permissions: [],
    enabled: true,
  },
  {
    id: "vector-shapes",
    name: "Architect Blueprint Templates",
    version: "0.9.5",
    description: "Predefined building shapes and architectural svg blocks.",
    permissions: ["filesystem"],
    enabled: false,
  }
];

function StudioHub() {
  const [plugins, setPlugins] = useState<PluginDef[]>(DEFAULT_PLUGINS);
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  
  // Custom sandbox status overrides
  const [sandboxPermissions, setSandboxPermissions] = useState<Record<string, string[]>>({
    "ai-assistant": ["network"],
    "formula-pack": [],
    "vector-shapes": ["filesystem"],
  });

  const launchApp = (app: string) => {
    // Navigate to standalone apps or route them inside the workspace
    if (app === "design") {
      window.location.href = "http://localhost:5176"; // liberty-design port
    } else if (app === "voice") {
      window.location.href = "http://localhost:5177"; // liberty-voice port
    } else {
      alert(`Launching standalone @liberty/${app}-app... (In Phase 16, this Tauri action invokes the OS binary)`);
    }
  };

  const togglePermission = (pluginId: string, permission: string) => {
    setSandboxPermissions((prev) => {
      const current = prev[pluginId] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [pluginId]: updated };
    });
  };

  const togglePluginEnabled = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Simulates C++ PluginManager validate_plugin validation check
  const handleInstallPlugin = () => {
    const defaultManifest = `{
  "name": "Custom Translator Hub",
  "version": "1.0.0",
  "description": "Translates documents instantly.",
  "permissions": ["network"]
}`;

    const manifestInput = prompt(
      "Paste your Plugin manifest JSON to validate and install:",
      defaultManifest
    );
    if (!manifestInput) return;

    try {
      const parsed = JSON.parse(manifestInput);
      const name = parsed.name || "Unnamed Plugin";
      const permissions = parsed.permissions || [];
      
      // Validation warnings simulation (matching C++ Kernel PluginManager validate_plugin)
      const hasNetwork = permissions.includes("network");
      const hasFilesystem = permissions.includes("filesystem");
      
      let validationMsg = "";
      if (hasNetwork || hasFilesystem) {
        validationMsg = `WARNING: C++ PluginManager detects elevated capabilities requested: ${
          hasNetwork ? "[network] " : ""
        }${hasFilesystem ? "[filesystem] " : ""}\nProceed to sandbox this plugin?`;
        
        const proceed = window.confirm(validationMsg);
        if (!proceed) {
          alert("Plugin installation aborted by user.");
          return;
        }
      }

      const newPlugin: PluginDef = {
        id: `plugin-${Math.random().toString(36).substring(2, 9)}`,
        name,
        version: parsed.version || "1.0.0",
        description: parsed.description || "No description provided.",
        permissions,
        enabled: true,
      };

      setPlugins((prev) => [...prev, newPlugin]);
      setSandboxPermissions((prev) => ({ ...prev, [newPlugin.id]: permissions }));
      alert(`SUCCESS: Installed ${name} successfully! Sandbox configurations active.`);
    } catch (e) {
      alert("ERROR: Invalid manifest JSON. Validation failed.");
    }
  };

  const selectedPlugin = plugins.find((p) => p.id === selectedPluginId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f3f3f0", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Title Header */}
      <header style={{ height: "50px", background: "#ffffff", borderBottom: "1px solid #d1d5db", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🐙</span>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>Liberty Studio Hub</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "11px", background: "#e5e7eb", color: "#4b5563", padding: "4px 8px", borderRadius: "12px", fontWeight: 600 }}>Tauri Shell v2.0.4</span>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: "flex", maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "32px 24px", gap: "32px", overflow: "auto" }}>
        {/* Left Side: Create Document */}
        <section style={{ flex: 1.5, display: "flex", flexDirection: "column", gap: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", margin: 0 }}>Create New Document</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            
            <div 
              onClick={() => launchApp("docs")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(29, 78, 216, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8" }}>
                <FileText size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>Liberty Write</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Create DOCX documents with layouts</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("sheets")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(21, 128, 61, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d" }}>
                <Grid3x3 size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>Liberty Sheets</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Calculate formulas and chart spreadsheets</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("impress")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(180, 83, 9, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                <Presentation size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>Liberty Impress</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Compile slideshow transitions</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("pdf-edit")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                <FileType2 size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>PDF Annotator</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Sign, stamp and rotate PDF documents</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("design")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(8, 145, 178, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0891b2" }}>
                <PenTool size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>Liberty Design</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Vector scene graph and SVG designer</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("voice")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                <Mic size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#111827" }}>Liberty Voice</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Speech recognition and audio transcription</span>
              </div>
            </div>

          </div>
        </section>

        {/* Right Side: Plugins & Sandbox Panel */}
        <section style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", margin: 0 }}>Plugins & Sandboxing</h2>
            <button 
              onClick={handleInstallPlugin}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: "#7c3aed", color: "white", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
            >
              <Plus size={14} /> Install
            </button>
          </div>

          <div style={{ flex: 1, background: "#ffffff", borderRadius: "8px", border: "1px solid #d1d5db", padding: "16px", display: "flex", flexDirection: "column", gap: "16px", minHeight: "350px" }}>
            {/* Plugins List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>Installed Extensions</span>
              
              {plugins.map((plugin) => (
                <div 
                  key={plugin.id}
                  onClick={() => setSelectedPluginId(plugin.id)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "10px", 
                    borderRadius: "6px", 
                    border: selectedPluginId === plugin.id ? "2px solid #7c3aed" : "1px solid #e5e7eb", 
                    background: selectedPluginId === plugin.id ? "#f9fafb" : "#ffffff",
                    cursor: "pointer" 
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Cpu size={16} color={plugin.enabled ? "#7c3aed" : "#9ca3af"} />
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827", display: "block" }}>{plugin.name}</span>
                      <span style={{ fontSize: "10px", color: "#6b7280" }}>v{plugin.version}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); togglePluginEnabled(plugin.id); }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: plugin.enabled ? "#10b981" : "#9ca3af" }}
                  >
                    {plugin.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              ))}
            </div>

            {/* Sandbox Details for Selected Plugin */}
            {selectedPlugin ? (
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={14} color="#7c3aed" />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Sandbox Permissions: {selectedPlugin.name}</span>
                </div>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 6px 0" }}>{selectedPlugin.description}</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", cursor: "pointer" }}>
                    <span>Allow Filesystem Access</span>
                    <input 
                      type="checkbox" 
                      checked={(sandboxPermissions[selectedPlugin.id] || []).includes("filesystem")} 
                      onChange={() => togglePermission(selectedPlugin.id, "filesystem")} 
                    />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", cursor: "pointer" }}>
                    <span>Allow Network Connections</span>
                    <input 
                      type="checkbox" 
                      checked={(sandboxPermissions[selectedPlugin.id] || []).includes("network")} 
                      onChange={() => togglePermission(selectedPlugin.id, "network")} 
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", textAlign: "center", fontSize: "11px", color: "#9ca3af" }}>
                Select a plugin to configure sandbox options
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StudioHub />
  </React.StrictMode>
);
