import { useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { Send, Bot, User } from "lucide-react";

interface LibertyChatAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

interface Message {
  sender: "user" | "bot";
  text: string;
}

/**
 * LibertyChatApp — The AI chat assistant application component matching
 * the visual style and design of Liberty Studio.
 */
export function LibertyChatApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyChatAppProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hello! I am your Liberty AI assistant. How can I help you write documents, calculate spreadsheet formulas, or compile layouts today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { sender: "user", text: userMsg }]);
    setInput("");

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: `I parsed: "${userMsg}". Computing AST operations using C++ native compiler kernel... Done. How would you like me to insert this into your active document?` }
      ]);
    }, 1000);
  };

  const homeTab = (
    <RibbonGroup label="AI Tools">
      <RibbonButton icon="✨" label="Suggest Formulas" onClick={() => alert("Formulas generation")} size="large" />
      <RibbonButton icon="📝" label="Summarize" onClick={() => alert("Summary generation")} size="large" />
    </RibbonGroup>
  );

  return (
    <>
      <Ribbon
        tabs={[{ id: "chat-home", label: "Home", content: homeTab }]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="workspace-view active" id="view-chat" style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f3f4f6" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px", overflowY: "auto", gap: "12px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "8px",
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              {msg.sender === "bot" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-accent, #2563eb)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", color: "#white" }}>
                  <Bot size={16} color="white" />
                </div>
              )}
              <div
                style={{
                  background: msg.sender === "user" ? "var(--color-accent, #2563eb)" : "#ffffff",
                  color: msg.sender === "user" ? "#ffffff" : "var(--color-text-primary)",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {msg.text}
              </div>
              {msg.sender === "user" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ddd", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ background: "#ffffff", padding: "12px", borderTop: "1px solid var(--color-border-secondary)" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask the Liberty AI assistant..."
              style={{
                flex: 1,
                border: "1px solid var(--color-border-secondary)",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                outline: "none",
                color: "var(--color-text-primary)",
                background: "var(--color-background-primary)",
              }}
            />
            <button
              onClick={handleSend}
              style={{
                background: "var(--color-accent, #2563eb)",
                border: "none",
                borderRadius: "6px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
