import React from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";
import { FileText, Grid3x3, Presentation, FileType2, Plus, Settings } from "lucide-react";

function StudioHub() {
  const launchApp = (app: string) => {
    alert(`Launching standalone @liberty/${app}-app... (In Phase 16, this Tauri action invokes the OS binary)`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f3f3ee", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Title Header */}
      <header style={{ height: "50px", background: "#ffffff", borderBottom: "1px solid #d8d4cc", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🐙</span>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a" }}>Liberty Studio Hub</span>
        </div>
        <button style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", color: "#666" }}>
          <Settings size={18} />
        </button>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, display: "flex", maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "32px 24px", gap: "32px" }}>
        {/* Left Side: Create Document */}
        <section style={{ flex: 1.5 }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Create New Document</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            
            <div 
              onClick={() => launchApp("docs")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d8d4cc", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(29, 78, 216, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1d4ed8" }}>
                <FileText size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#1a1a1a" }}>Liberty Write</span>
                <span style={{ fontSize: "11px", color: "#666" }}>Create DOCX documents with layouts</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("sheets")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d8d4cc", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(21, 128, 61, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d" }}>
                <Grid3x3 size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#1a1a1a" }}>Liberty Sheets</span>
                <span style={{ fontSize: "11px", color: "#666" }}>Calculate formulas and chart spreadsheets</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("impress")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d8d4cc", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(180, 83, 9, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                <Presentation size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#1a1a1a" }}>Liberty Impress</span>
                <span style={{ fontSize: "11px", color: "#666" }}>Compile slideshow transitions</span>
              </div>
            </div>

            <div 
              onClick={() => launchApp("pdf-edit")}
              style={{ background: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #d8d4cc", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px", transition: "transform 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                <FileType2 size={20} />
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: "13px", display: "block", color: "#1a1a1a" }}>PDF Annotator</span>
                <span style={{ fontSize: "11px", color: "#666" }}>Sign, stamp and rotate PDF documents</span>
              </div>
            </div>

          </div>
        </section>

        {/* Right Side: Recent Files */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>Recent Files</h2>
          <div style={{ flex: 1, background: "#ffffff", borderRadius: "8px", border: "1px solid #d8d4cc", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f3f3ee", paddingBottom: "8px" }}>
              <FileText size={16} color="#1d4ed8" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, display: "block", color: "#1a1a1a" }}>Marketing Plan Q3.docx</span>
                <span style={{ fontSize: "10px", color: "#999" }}>Opened 2 hours ago</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f3f3ee", paddingBottom: "8px" }}>
              <Grid3x3 size={16} color="#15803d" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, display: "block", color: "#1a1a1a" }}>Budget Forecast 2026.xlsx</span>
                <span style={{ fontSize: "10px", color: "#999" }}>Opened yesterday</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Presentation size={16} color="#b45309" />
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, display: "block", color: "#1a1a1a" }}>Product Pitch.pptx</span>
                <span style={{ fontSize: "10px", color: "#999" }}>Opened 3 days ago</span>
              </div>
            </div>
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
