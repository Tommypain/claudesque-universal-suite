import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { LibertyVoiceApp } from "@liberty/ui";
import "@liberty/themes/office.css";
import "@liberty/themes/host.css";

function VoiceAppContainer() {
  const [activeTab, setActiveTab] = useState("home");

  const handleReturn = () => {
    window.location.href = "/";
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Header switcher link */}
      <div style={{ display: "flex", background: "#7c3aed", color: "white", padding: "8px 16px", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", fontFamily: "Segoe UI, sans-serif" }}>
        <span style={{ fontWeight: 600, fontSize: "14px" }}>Liberty Voice Studio</span>
        <button
          onClick={handleReturn}
          style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "4px 12px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
        >
          Back to Hub
        </button>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <LibertyVoiceApp
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <VoiceAppContainer />
  </React.StrictMode>
);
