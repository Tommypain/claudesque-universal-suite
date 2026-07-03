import { useEffect, useRef, useState } from "react";
import { Ribbon, RibbonGroup, RibbonButton } from "@liberty/ui";
import { useDocumentStore, useAppStore } from "@liberty/shared-hooks";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

const PDF_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.189/pdf.min.mjs";
const WORKER_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.189/pdf.worker.min.mjs";

async function loadPdfJs(): Promise<any> {
  // @ts-expect-error global
  if (window.pdfjsLib) return window.pdfjsLib;
  const lib = await import(/* @vite-ignore */ PDF_SRC);
  lib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  // @ts-expect-error global
  window.pdfjsLib = lib;
  return lib;
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
 * structure, and DOM classes of the OfficeSuite PDF Viewer.
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
  const addToast = useAppStore((s) => s.addToast);
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const docRef = useRef<any>(null);

  useEffect(() => {
    if (!pdfBuffer) return;
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument({ data: pdfBuffer.slice(0) }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setPage(1);
      } catch (e) {
        addToast("Failed to render PDF");
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfBuffer, addToast]);

  useEffect(() => {
    const doc = docRef.current;
    const container = containerRef.current;
    if (!doc || !container) return;
    let cancelled = false;
    (async () => {
      const p = await doc.getPage(page);
      if (cancelled) return;
      const viewport = p.getViewport({ scale: zoom });
      container.innerHTML = "";
      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      container.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      await p.render({ canvasContext: ctx, viewport }).promise;
    })();
    return () => {
      cancelled = true;
    };
  }, [page, zoom, numPages]);

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

  const homeTab = (
    <>
      <RibbonGroup label="File">
        <RibbonButton icon="📂" label="Open PDF" size="large" onClick={triggerOpen} />
      </RibbonGroup>
      <RibbonGroup label="Navigate">
        <RibbonButton icon={<ChevronLeft size={16} />} label="Prev" onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <span style={{ fontSize: 12, alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Page
          <input
            type="number"
            value={page}
            min={1}
            max={numPages || 1}
            style={{ width: "40px", height: "24px", textAlign: "center", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
            onChange={(e) => setPage(Math.min(numPages || 1, Math.max(1, Number(e.target.value))))}
          />
          of {numPages || 1}
        </span>
        <RibbonButton icon={<ChevronRight size={16} />} label="Next" onClick={() => setPage((p) => Math.min(numPages || 1, p + 1))} />
      </RibbonGroup>
      <RibbonGroup label="Zoom">
        <RibbonButton icon={<ZoomOut size={16} />} label="Zoom Out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} />
        <span style={{ fontSize: 12, alignSelf: "center" }}>{Math.round(zoom * 100)}%</span>
        <RibbonButton icon={<ZoomIn size={16} />} label="Zoom In" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} />
      </RibbonGroup>
    </>
  );

  return (
    <>
      <Ribbon
        tabs={[
          { id: "pdf-home", label: "Home", content: homeTab },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="workspace-view active" id="view-pdf">
        <div className="pdf-canvas-view" style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* PDF Pages Sidebar */}
          <div className="pdf-sidebar" id="pdf-pages-nav" style={{ width: "170px", overflowY: "auto", background: "var(--color-background-secondary)", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">PDF Pages</div>
            {Array.from({ length: numPages || 1 }).map((_, idx) => (
              <div
                key={idx}
                className={`slide-thumbnail ${idx + 1 === page ? "active" : ""}`}
                style={{
                  width: "100%",
                  aspectRatio: "1/1.4",
                  background: "#ffffff",
                  border: idx + 1 === page ? "2px solid var(--color-accent, #2563eb)" : "1px solid var(--color-border-secondary)",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#aaa",
                }}
                onClick={() => setPage(idx + 1)}
              >
                Page {idx + 1}
              </div>
            ))}
          </div>

          {/* PDF Document view */}
          <div className="pdf-document-scroll" id="pdf-scroll-container" style={{ flex: 1, overflowY: "auto", background: "#eaeae4", padding: 16 }}>
            {pdfBuffer ? (
              <div ref={containerRef} style={{ display: "flex", justifyContent: "center", minHeight: "100%" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#888" }}>
                <span>No PDF Document Loaded</span>
                <button className="btn blg" onClick={triggerOpen} style={{ cursor: "pointer" }}>
                  Open PDF File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
