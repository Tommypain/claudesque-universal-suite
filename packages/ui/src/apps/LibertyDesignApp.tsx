import React, { useRef, useState } from "react";
import { Ribbon, RibbonGroup, RibbonButton } from "@liberty/ui";
import { useDocumentStore, useAppStore, type VectorShape } from "@liberty/shared-hooks";
import { Square, Circle, Minus, Trash2, FolderOpen, Save, Undo, Redo } from "lucide-react";

interface LibertyDesignAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * LibertyDesignApp — The React vector drawing component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite Design suite (Liberty Design).
 */
export function LibertyDesignApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyDesignAppProps) {
  const designShapes = useDocumentStore((s) => s.designShapes);
  const setDesignShapes = useDocumentStore((s) => s.setDesignShapes);
  const addDesignShape = useDocumentStore((s) => s.addDesignShape);
  const setDirty = useDocumentStore((s) => s.setDirty);
  const addToast = useAppStore((s) => s.addToast);
  
  const [selectedFill, setSelectedFill] = useState("#3b82f6");
  const [selectedStroke, setSelectedStroke] = useState("#1e3a8a");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addShape = (type: "rect" | "circle" | "line") => {
    const id = `shape-${Math.random().toString(36).substring(2, 9)}`;
    const x = 100 + Math.random() * 400;
    const y = 100 + Math.random() * 300;
    const width = 100;
    const height = 100;
    
    const newShape: VectorShape = {
      id,
      type,
      x,
      y,
      width,
      height,
      fill: type === "line" ? "none" : selectedFill,
      stroke: selectedStroke,
    };
    addDesignShape(newShape);
    addToast(`Added ${type} shape`);
  };

  const clearCanvas = () => {
    setDesignShapes([]);
    addToast("Cleared canvas");
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  // We import useFileManager dynamically or from props to process imports
  const openFileHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parser = new DOMParser();
      const docNode = parser.parseFromString(text, "image/svg+xml");
      const shapes: VectorShape[] = [];
      
      docNode.querySelectorAll("rect").forEach((el) => {
        shapes.push({
          id: el.getAttribute("id") || `shape-${Math.random().toString(36).substring(2, 9)}`,
          type: "rect",
          x: parseFloat(el.getAttribute("x") || "0"),
          y: parseFloat(el.getAttribute("y") || "0"),
          width: parseFloat(el.getAttribute("width") || "100"),
          height: parseFloat(el.getAttribute("height") || "100"),
          fill: el.getAttribute("fill") || "#cccccc",
          stroke: el.getAttribute("stroke") || "none",
        });
      });
      
      docNode.querySelectorAll("circle").forEach((el) => {
        const r = parseFloat(el.getAttribute("r") || "50");
        shapes.push({
          id: el.getAttribute("id") || `shape-${Math.random().toString(36).substring(2, 9)}`,
          type: "circle",
          x: parseFloat(el.getAttribute("cx") || "0"),
          y: parseFloat(el.getAttribute("cy") || "0"),
          width: r * 2,
          height: r * 2,
          fill: el.getAttribute("fill") || "#cccccc",
          stroke: el.getAttribute("stroke") || "none",
        });
      });
      
      docNode.querySelectorAll("line").forEach((el) => {
        const x1 = parseFloat(el.getAttribute("x1") || "0");
        const y1 = parseFloat(el.getAttribute("y1") || "0");
        const x2 = parseFloat(el.getAttribute("x2") || "100");
        const y2 = parseFloat(el.getAttribute("y2") || "100");
        shapes.push({
          id: el.getAttribute("id") || `shape-${Math.random().toString(36).substring(2, 9)}`,
          type: "line",
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
          fill: el.getAttribute("fill") || "none",
          stroke: el.getAttribute("stroke") || "#000000",
        });
      });
      
      setDesignShapes(shapes);
      setDirty(false);
      addToast(`Imported SVG with ${shapes.length} shapes`);
    };
    reader.readAsText(file);
  };

  const homeTab = (
    <>
      <RibbonGroup label="File">
        <RibbonButton icon={<FolderOpen size={16} />} label="Open SVG" size="large" onClick={handleOpenClick} />
        <RibbonButton icon={<Save size={16} />} label="Save SVG" size="large" onClick={onSave} />
      </RibbonGroup>
      <RibbonGroup label="Shapes">
        <RibbonButton icon={<Square size={16} />} label="Rectangle" size="large" onClick={() => addShape("rect")} />
        <RibbonButton icon={<Circle size={16} />} label="Circle" size="large" onClick={() => addShape("circle")} />
        <RibbonButton icon={<Minus size={16} />} label="Line" size="large" onClick={() => addShape("line")} />
      </RibbonGroup>
      <RibbonGroup label="Styling">
        <label className="btn bsm" title="Fill Color" style={{ display: "inline-flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>
          <span>Fill</span>
          <input
            type="color"
            value={selectedFill}
            style={{ width: 24, height: 18, border: "none", background: "transparent", cursor: "pointer" }}
            onChange={(e) => setSelectedFill(e.target.value)}
          />
        </label>
        <label className="btn bsm" title="Stroke Color" style={{ display: "inline-flex", gap: "8px", alignItems: "center", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>
          <span>Border</span>
          <input
            type="color"
            value={selectedStroke}
            style={{ width: 24, height: 18, border: "none", background: "transparent", cursor: "pointer" }}
            onChange={(e) => setSelectedStroke(e.target.value)}
          />
        </label>
      </RibbonGroup>
      <RibbonGroup label="Operations">
        <RibbonButton icon={<Undo size={16} />} label="Undo" size="large" onClick={onUndo} />
        <RibbonButton icon={<Redo size={16} />} label="Redo" size="large" onClick={onRedo} />
        <RibbonButton icon={<Trash2 size={16} />} label="Clear All" size="large" onClick={clearCanvas} />
      </RibbonGroup>
    </>
  );

  return (
    <div className="office-editor-outer" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f3f3f0" }}>
      <input 
        type="file" 
        accept=".svg" 
        ref={fileInputRef} 
        onChange={openFileHandler} 
        style={{ display: "none" }} 
      />
      <Ribbon 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        tabs={[{ id: "home", label: "Home", content: homeTab }]}
      />
      
      {/* Design Editor Workspace Canvas */}
      <div 
        className="editor-workspace" 
        style={{ 
          flex: 1, 
          overflow: "auto", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "24px"
        }}
      >
        <div 
          className="canvas-container"
          style={{
            width: 800,
            height: 600,
            background: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            borderRadius: "4px",
            position: "relative"
          }}
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 800 600" 
            style={{ display: "block" }}
          >
            {designShapes.map((shape) => {
              if (shape.type === "rect") {
                return (
                  <rect
                    key={shape.id}
                    id={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth="2"
                  />
                );
              } else if (shape.type === "circle") {
                return (
                  <circle
                    key={shape.id}
                    id={shape.id}
                    cx={shape.x}
                    cy={shape.y}
                    r={shape.width / 2}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth="2"
                  />
                );
              } else if (shape.type === "line") {
                return (
                  <line
                    key={shape.id}
                    id={shape.id}
                    x1={shape.x}
                    y1={shape.y}
                    x2={shape.x + shape.width}
                    y2={shape.y + shape.height}
                    stroke={shape.stroke}
                    strokeWidth="2"
                  />
                );
              }
              return null;
            })}
          </svg>
        </div>
      </div>
      
      {/* Bottom Status Bar */}
      <div 
        className="status-bar" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          padding: "4px 16px", 
          background: "#0891b2", 
          color: "white", 
          fontSize: "12px" 
        }}
      >
        <span>Ready</span>
        <span>Shapes: {designShapes.length} | Layout: 800 x 600 px</span>
      </div>
    </div>
  );
}
