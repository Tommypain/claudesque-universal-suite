import React from "react";
import ReactDOM from "react-dom/client";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";

function DesignAppStub() {
  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f3ee", fontFamily: "Segoe UI, sans-serif", flexDirection: "column", gap: "12px" }}>
      <span style={{ fontSize: "48px" }}>🎨</span>
      <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a1a" }}>Liberty Design</h1>
      <p style={{ fontSize: "13px", color: "#666" }}>Vector drawing and desktop publishing engine stub.</p>
      <button 
        onClick={() => alert("Launching Liberty Studio Hub...")}
        style={{ marginTop: "16px", padding: "8px 16px", background: "#1d4ed8", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
      >
        Return to Hub
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DesignAppStub />
  </React.StrictMode>
);
