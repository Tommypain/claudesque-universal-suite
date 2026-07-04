import React, { useEffect, useRef, useState } from "react";
import { Ribbon, RibbonGroup, RibbonButton } from "@liberty/ui";
import { useDocumentStore, useAppStore } from "@liberty/shared-hooks";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Type, PenTool, Trash2, FolderOpen, Save } from "lucide-react";

interface Annotation {
  page: number;
  type: "text" | "signature";
  x: number;
  y: number;
  text?: string;
  points?: { x: number; y: number }[]; // for freehand signature path
}

interface LibertyPdfAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * LibertyPdfApp — The React PDF application component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite PDF Viewer, operating completely offline.
 */
export function LibertyPdfApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyPdfAppProps) {
  const pdfBuffer = useDocumentStore((s) => s.pdfBuffer);
  const setPdf = useDocumentStore((s) => s.setPdf);
  const fileName = useDocumentStore((s) => s.pdfName);
  const setDirty = useDocumentStore((s) => s.setDirty);
  const addToast = useAppStore((s) => s.addToast);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [numPages, setNumPages] = useState(1);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<"hand" | "text" | "signature">("hand");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  // Parse pages and annotations from the PDF buffer
  useEffect(() => {
    if (!pdfBuffer) return;
    try {
      const bytes = new Uint8Array(pdfBuffer);
      const isPdf = bytes.length >= 5 &&
                    bytes[0] === 0x25 && bytes[1] === 0x50 &&
                    bytes[2] === 0x44 && bytes[3] === 0x46 &&
                    bytes[4] === 0x2D; // %PDF-
      
      if (!isPdf) {
        addToast("Warning: Invalid PDF header signature");
        setNumPages(1);
        setAnnotations([]);
        return;
      }

      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(bytes);
      
      // Count pages
      let count = 0;
      let pos = 0;
      while (true) {
        pos = text.indexOf("/Type /Page", pos);
        if (pos === -1) break;
        count++;
        pos += 11;
      }
      
      if (count <= 0) {
        const m = text.match(/\/Count\s+(\d+)/);
        count = m ? parseInt(m[1]) : 1;
      }
      setNumPages(count || 1);
      setPage(1);

      // Parse metadata annotations if they exist
      let parsedAnns: Annotation[] = [];
      const token = "%LibertyPDFMetadata[";
      const idx = text.indexOf(token);
      if (idx !== -1) {
        const start = idx + token.length;
        const end = text.indexOf("]", start);
        if (end !== -1) {
          try {
            parsedAnns = JSON.parse(text.substring(start, end));
          } catch (e) {
            console.error("Failed to parse PDF metadata annotations", e);
          }
        }
      }
      setAnnotations(parsedAnns);
    } catch (e) {
      addToast("Failed to open PDF file");
      console.error(e);
    }
  }, [pdfBuffer, addToast]);

  // Render Page on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions based on A4 ratio (1:1.4)
    const baseWidth = 500;
    const baseHeight = 700;
    canvas.width = baseWidth * zoom;
    canvas.height = baseHeight * zoom;

    // Background Page structure
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw document grid / mock text lines to represent layout
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(20 * zoom, 20 * zoom, canvas.width - 40 * zoom, 40 * zoom); // Header block
    
    ctx.fillStyle = "#374151";
    ctx.font = `${14 * zoom}px Segoe UI, sans-serif`;
    ctx.fillText(fileName || "Liberty PDF Document", 30 * zoom, 45 * zoom);

    // Draw mock text page lines
    ctx.fillStyle = "#e5e7eb";
    const lineCount = 18;
    for (let i = 0; i < lineCount; i++) {
      const y = 90 * zoom + i * 30 * zoom;
      const blockWidth = canvas.width - 80 * zoom - (Math.sin(i + page) * 60 * zoom);
      ctx.fillRect(40 * zoom, y, blockWidth, 12 * zoom);
    }

    // Bottom page footer
    ctx.fillStyle = "#9ca3af";
    ctx.font = `${11 * zoom}px Segoe UI, sans-serif`;
    ctx.fillText(`Page ${page} of ${numPages}`, canvas.width / 2 - 30 * zoom, canvas.height - 30 * zoom);

    // Render Overlay Annotations
    annotations
      .filter((ann) => ann.page === page)
      .forEach((ann) => {
        if (ann.type === "text") {
          ctx.fillStyle = "#1e3a8a";
          ctx.font = `bold ${13 * zoom}px Segoe UI, sans-serif`;
          ctx.fillText(ann.text || "", ann.x * zoom, ann.y * zoom);
        } else if (ann.type === "signature" && ann.points && ann.points.length > 0) {
          ctx.strokeStyle = "#111827";
          ctx.lineWidth = 2.5 * zoom;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x * zoom, ann.points[0].y * zoom);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x * zoom, ann.points[i].y * zoom);
          }
          ctx.stroke();
        }
      });
  }, [page, zoom, numPages, annotations, fileName]);

  const triggerOpen = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (f) {
        const buf = await f.arrayBuffer();
        setPdf(buf, f.name);
      }
    };
    input.click();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pdfBuffer || activeTool === "hand") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    if (activeTool === "text") {
      const textVal = prompt("Enter annotation note text:");
      if (textVal) {
        const newAnn: Annotation = {
          page,
          type: "text",
          x: clickX,
          y: clickY,
          text: textVal,
        };
        setAnnotations((prev) => [...prev, newAnn]);
        setDirty(true);
        addToast("Added text note");
      }
      setActiveTool("hand");
    } else if (activeTool === "signature") {
      setShowSignDialog(true);
      signaturePathsRef.current = { x: clickX, y: clickY };
    }
  };

  const signaturePathsRef = useRef<{ x: number; y: number } | null>(null);

  // Signature Pad Handlers
  const startSignatureDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawingSignature(true);
    setSignaturePaths((prev) => [...prev, [{ x, y }]]);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSignaturePaths((prev) => {
      if (prev.length === 0) return prev;
      const lastPath = prev[prev.length - 1];
      const updatedLastPath = [...lastPath, { x, y }];
      return [...prev.slice(0, -1), updatedLastPath];
    });

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      const lastPath = signaturePaths[signaturePaths.length - 1];
      if (lastPath && lastPath.length > 0) {
        const prevPt = lastPath[lastPath.length - 1];
        ctx.beginPath();
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopSignatureDrawing = () => {
    setIsDrawingSignature(false);
  };

  const applySignature = () => {
    if (signaturePaths.length === 0 || !signaturePathsRef.current) {
      setShowSignDialog(false);
      return;
    }

    let minX = 99999, minY = 99999, maxX = -99999, maxY = -99999;
    signaturePaths.forEach((path) => {
      path.forEach((pt) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      });
    });

    const sigW = maxX - minX;
    const sigH = maxY - minY;
    const clickX = signaturePathsRef.current.x;
    const clickY = signaturePathsRef.current.y;

    const scale = Math.min(100 / sigW, 40 / sigH, 1.0);
    const points: { x: number; y: number }[] = [];
    
    signaturePaths.forEach((path) => {
      path.forEach((pt) => {
        points.push({
          x: clickX + (pt.x - (minX + sigW / 2)) * scale,
          y: clickY + (pt.y - (minY + sigH / 2)) * scale,
        });
      });
    });

    const newAnn: Annotation = {
      page,
      type: "signature",
      x: clickX,
      y: clickY,
      points,
    };
    
    setAnnotations((prev) => [...prev, newAnn]);
    setDirty(true);
    setShowSignDialog(false);
    setSignaturePaths([]);
    setActiveTool("hand");
    addToast("Applied signature");
  };

  const clearSignaturePad = () => {
    setSignaturePaths([]);
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
    setDirty(true);
    addToast("Cleared annotations");
  };

  const handleSavePDF = () => {
    if (!pdfBuffer) return;
    const jsonData = JSON.stringify(annotations);
    const metaStub = "\n%LibertyPDFMetadata[" + jsonData + "]\n%%EOF\n";
    
    const bytes = new Uint8Array(pdfBuffer);
    const encoder = new TextEncoder();
    const metaBytes = encoder.encode(metaStub);
    
    const finalBytes = new Uint8Array(bytes.length + metaBytes.length);
    finalBytes.set(bytes, 0);
    finalBytes.set(metaBytes, bytes.length);

    const blob = new Blob([finalBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + "_annotated.pdf";
    a.click();
    URL.revokeObjectURL(url);
    
    setDirty(false);
    addToast("Saved annotated PDF");
  };

  const homeTab = (
    <>
      <RibbonGroup label="File">
        <RibbonButton icon={<FolderOpen size={16} />} label="Open PDF" size="large" onClick={triggerOpen} />
        <RibbonButton icon={<Save size={16} />} label="Save PDF" size="large" onClick={handleSavePDF} />
      </RibbonGroup>
      <RibbonGroup label="Navigate">
        <RibbonButton icon={<ChevronLeft size={16} />} label="Prev" onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <span style={{ fontSize: 12, alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "Segoe UI, sans-serif" }}>
          Page {page} of {numPages}
        </span>
        <RibbonButton icon={<ChevronRight size={16} />} label="Next" onClick={() => setPage((p) => Math.min(numPages, p + 1))} />
      </RibbonGroup>
      <RibbonGroup label="Zoom">
        <RibbonButton icon={<ZoomOut size={16} />} label="Zoom Out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} />
        <span style={{ fontSize: 12, alignSelf: "center", fontFamily: "Segoe UI, sans-serif" }}>{Math.round(zoom * 100)}%</span>
        <RibbonButton icon={<ZoomIn size={16} />} label="Zoom In" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} />
      </RibbonGroup>
      <RibbonGroup label="Annotations">
        <RibbonButton 
          icon={<Type size={16} />} 
          label="Add Note" 
          active={activeTool === "text"}
          onClick={() => setActiveTool(activeTool === "text" ? "hand" : "text")} 
        />
        <RibbonButton 
          icon={<PenTool size={16} />} 
          label="Sign" 
          active={activeTool === "signature"}
          onClick={() => setActiveTool(activeTool === "signature" ? "hand" : "signature")} 
        />
        <RibbonButton icon={<Trash2 size={16} />} label="Clear All" onClick={clearAllAnnotations} />
      </RibbonGroup>
    </>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#f3f3f0" }}>
      <Ribbon
        tabs={[{ id: "pdf-home", label: "Home", content: homeTab }]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={handleSavePDF}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* PDF Pages Sidebar */}
        <div style={{ width: "170px", overflowY: "auto", background: "#eaeae4", padding: 8, display: "flex", flexDirection: "column", gap: 8, borderRight: "1px solid #d1d5db" }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontFamily: "Segoe UI, sans-serif" }}>
            PDF Pages
          </div>
          {Array.from({ length: numPages }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: "100%",
                aspectRatio: "1/1.4",
                background: "#ffffff",
                border: idx + 1 === page ? "2px solid #7c3aed" : "1px solid #d1d5db",
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: "#6b7280",
                fontFamily: "Segoe UI, sans-serif"
              }}
              onClick={() => setPage(idx + 1)}
            >
              Page {idx + 1}
            </div>
          ))}
        </div>

        {/* PDF Document view */}
        <div style={{ flex: 1, overflowY: "auto", background: "#eaeae4", padding: "16px", display: "flex", justifyContent: "center" }}>
          {pdfBuffer ? (
            <div style={{ position: "relative" }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  display: "block",
                  margin: "0 auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "4px",
                  cursor: activeTool === "hand" ? "default" : "crosshair"
                }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#888", fontFamily: "Segoe UI, sans-serif" }}>
              <span>No PDF Document Loaded</span>
              <button className="btn blg" onClick={triggerOpen} style={{ cursor: "pointer", padding: "8px 16px", background: "#7c3aed", color: "white", border: "none", borderRadius: "6px", fontWeight: 600 }}>
                Open PDF File
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad Dialog */}
      {showSignDialog && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, fontFamily: "Segoe UI, sans-serif" }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Draw Your Signature</h3>
            
            <canvas
              ref={signatureCanvasRef}
              width={400}
              height={150}
              onMouseDown={startSignatureDrawing}
              onMouseMove={drawSignature}
              onMouseUp={stopSignatureDrawing}
              onMouseLeave={stopSignatureDrawing}
              style={{
                background: "#f9fafb",
                border: "2px dashed #d1d5db",
                borderRadius: 4,
                cursor: "crosshair"
              }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button 
                onClick={clearSignaturePad}
                style={{ padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
              >
                Clear
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => setShowSignDialog(false)}
                  style={{ padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={applySignature}
                  style={{ padding: "8px 16px", background: "#7c3aed", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
