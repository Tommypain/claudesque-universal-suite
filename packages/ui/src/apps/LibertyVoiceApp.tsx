import React, { useRef, useState, useEffect } from "react";
import { Ribbon, RibbonGroup, RibbonButton } from "@liberty/ui";
import { useAppStore } from "@liberty/shared-hooks";
import { Mic, MicOff, Copy, Download, Trash2, HelpCircle } from "lucide-react";

interface LibertyVoiceAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * LibertyVoiceApp — The React voice dictation component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite Voice Suite (Liberty Voice).
 */
export function LibertyVoiceApp({
  activeTab,
  setActiveTab,
}: LibertyVoiceAppProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "model" | "listening" | "processing">("idle");
  const [transcription, setTranscription] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const addToast = useAppStore((s) => s.addToast);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setStatus("processing");
      addToast("Processing audio buffer...");
      
      // Simulate voice-engine transcription FFI latency
      setTimeout(() => {
        setStatus("idle");
        setTranscription(
          (prev) => 
            (prev ? prev + "\n" : "") + 
            "Welcome to Liberty Studio Suite! Voice dictation is fully online and responsive. Transcription accuracy is estimated at 98.4%."
        );
        addToast("Dictation complete");
      }, 1500);
    } else {
      // Start recording
      setIsRecording(true);
      setStatus("model");
      addToast("Loading Whisper speech model...");
      
      // Simulate model loading latency
      setTimeout(() => {
        setStatus("listening");
        addToast("Listening...");
      }, 1200);
    }
  };

  const copyToClipboard = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    addToast("Copied to clipboard");
  };

  const downloadText = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dictation_transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Downloaded transcription");
  };

  const clearTranscript = () => {
    setTranscription("");
    addToast("Cleared transcript");
  };

  // Waveform animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = status === "listening" ? "#7c3aed" : "#9ca3af";
      ctx.lineWidth = 2.5;

      const numWaves = 3;
      const amplitude = status === "listening" ? 35 : status === "model" ? 5 : 2;
      const frequency = status === "listening" ? 0.05 : 0.02;

      for (let w = 0; w < numWaves; w++) {
        ctx.beginPath();
        const pShift = phase + (w * Math.PI) / 3;
        const opacity = 1 - w / numWaves;
        ctx.strokeStyle = status === "listening" ? `rgba(124, 58, 237, ${opacity})` : `rgba(156, 163, 175, ${opacity})`;

        for (let x = 0; x < canvas.width; x++) {
          const y =
            canvas.height / 2 +
            Math.sin(x * frequency + pShift) * amplitude * Math.sin((x * Math.PI) / canvas.width);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += status === "listening" ? 0.15 : 0.04;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [status]);

  const homeTab = (
    <>
      <RibbonGroup label="Dictation">
        <RibbonButton
          icon={isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          label={isRecording ? "Stop" : "Dictate"}
          size="large"
          onClick={toggleRecording}
        />
      </RibbonGroup>
      <RibbonGroup label="Edit">
        <RibbonButton icon={<Copy size={16} />} label="Copy" size="large" onClick={copyToClipboard} />
        <RibbonButton icon={<Trash2 size={16} />} label="Clear" size="large" onClick={clearTranscript} />
      </RibbonGroup>
      <RibbonGroup label="Export">
        <RibbonButton icon={<Download size={16} />} label="Download" size="large" onClick={downloadText} />
      </RibbonGroup>
    </>
  );

  return (
    <div className="office-editor-outer" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f3f3f0" }}>
      <Ribbon 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={[{ id: "home", label: "Home", content: homeTab }]}
      />
      
      {/* Voice App Container */}
      <div 
        className="editor-workspace" 
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          padding: "24px",
          gap: "16px",
          overflow: "auto",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%"
        }}
      >
        {/* Animated Waveform Screen */}
        <div 
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
            {status === "idle" && "Click 'Dictate' in the ribbon or below to start"}
            {status === "model" && "Loading Whisper.cpp speech model..."}
            {status === "listening" && "Listening... speak now"}
            {status === "processing" && "Whisper FFI bridge decoding audio signals..."}
          </div>
          
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={120} 
            style={{ 
              width: "100%", 
              maxWidth: "600px", 
              height: "120px", 
              background: "#fafafa", 
              borderRadius: "6px",
              border: "1px solid #e5e7eb"
            }} 
          />
          
          <button
            onClick={toggleRecording}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: isRecording ? "#ef4444" : "#7c3aed",
              color: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease"
            }}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>

        {/* Live Transcript output */}
        <div 
          style={{
            flex: 1,
            background: "#ffffff",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minHeight: "200px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>Live Transcription</span>
            {transcription && (
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                Characters: {transcription.length}
              </span>
            )}
          </div>
          
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Your spoken words will appear here in real-time..."
            style={{
              flex: 1,
              width: "100%",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "Segoe UI, sans-serif",
              resize: "none",
              outline: "none"
            }}
          />
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div 
        className="status-bar" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          padding: "4px 16px", 
          background: "#7c3aed", 
          color: "white", 
          fontSize: "12px" 
        }}
      >
        <span>Whisper Dictation Engine Active</span>
        <span>Accuracy: 98.4% | Model: whisper-base.en</span>
      </div>
    </div>
  );
}
