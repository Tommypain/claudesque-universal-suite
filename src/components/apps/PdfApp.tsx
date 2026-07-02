import { useEffect, useRef, useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { useDocumentStore } from "../../store/useDocumentStore";
import { useAppStore } from "../../store/useAppStore";

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

export function PdfApp() {
  const pdfBuffer = useDocumentStore((s) => s.pdfBuffer);
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
      canvas.className = "oct-pdf-canvas";
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
        useDocumentStore.getState().setPdf(buf, f.name);
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
        <RibbonButton icon="◀" label="Prev" onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <span style={{ fontSize: 12, alignSelf: "center" }}>
          <input
            type="number"
            value={page}
            min={1}
            max={numPages}
            style={{ width: 44 }}
            className="oct-select"
            onChange={(e) => setPage(Math.min(numPages, Math.max(1, +e.target.value)))}
          />{" "}
          / {numPages || "—"}
        </span>
        <RibbonButton icon="▶" label="Next" onClick={() => setPage((p) => Math.min(numPages, p + 1))} />
      </RibbonGroup>
      <RibbonGroup label="Zoom">
        <RibbonButton icon="➖" label="Out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} />
        <RibbonButton icon="➕" label="In" onClick={() => setZoom((z) => Math.min(3, z + 0.2))} />
      </RibbonGroup>
    </>
  );

  return (
    <>
      <Ribbon tabs={[{ id: "home", label: "Home", content: homeTab }]} />
      <div className="oct-workspace">
        {pdfBuffer ? (
          <div className="oct-pdf-wrap" ref={containerRef} />
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-2)", marginTop: 80 }}>
            <div style={{ fontSize: 48 }}>📄</div>
            <p>Open a PDF to view and annotate</p>
            <button className="oct-btn primary" onClick={triggerOpen} style={{ marginTop: 12 }}>
              Open PDF
            </button>
          </div>
        )}
      </div>
    </>
  );
}
