import { create } from "zustand";

export interface SlideText {
  id: string;
  x: number;
  y: number;
  html: string;
}
export interface Slide {
  id: string;
  bg: string;
  theme: string;
  texts: SlideText[];
}
export interface VectorShape {
  id: string;
  type: "rect" | "circle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
}

export type HtmlPagePreset = "a4-portrait" | "a4-landscape" | "slide-16-9" | "slide-4-3" | "custom";
export type HtmlPageMode = "flow" | "fixed";
export type HtmlEditMode = "design" | "code" | "split";

interface DocState {
  fileName: string;
  dirty: boolean;
  // write
  writeHtml: string;
  // sheet
  sheet: Record<string, string>;
  // present
  slides: Slide[];
  currentSlide: number;
  // design
  designShapes: VectorShape[];
  // pdf
  pdfBuffer: ArrayBuffer | null;
  pdfName: string;
  // html studio
  htmlDoc: string;
  htmlPreset: HtmlPagePreset;
  htmlMode: HtmlPageMode;
  htmlEditMode: HtmlEditMode;
  htmlZoom: number;
  htmlSelectedId: string | null;

  setFileName: (n: string) => void;
  setDirty: (d: boolean) => void;
  setWriteHtml: (h: string) => void;
  setSheetCell: (id: string, v: string) => void;
  setSheet: (data: Record<string, string>) => void;
  setSlides: (s: Slide[]) => void;
  setCurrentSlide: (i: number) => void;
  setDesignShapes: (s: VectorShape[]) => void;
  addDesignShape: (s: VectorShape) => void;
  addSlide: () => void;
  deleteSlide: (i: number) => void;
  updateSlide: (i: number, patch: Partial<Slide>) => void;
  setPdf: (buf: ArrayBuffer | null, name: string) => void;
  // html studio actions
  setHtmlDoc: (html: string) => void;
  setHtmlPreset: (preset: HtmlPagePreset) => void;
  setHtmlMode: (mode: HtmlPageMode) => void;
  setHtmlEditMode: (mode: HtmlEditMode) => void;
  setHtmlZoom: (zoom: number) => void;
  setHtmlSelectedId: (id: string | null) => void;
}

function newSlide(): Slide {
  return {
    id: Math.random().toString(36).slice(2),
    bg: "#ffffff",
    theme: "theme-plain",
    texts: [
      { id: "t1", x: 80, y: 80, html: "Click to add title" },
      { id: "t2", x: 80, y: 200, html: "Click to add text" },
    ],
  };
}

export const DEFAULT_HTML_DOC = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>A4 Document</title>
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #1a1a1a; line-height: 1.6; }
    .page { width: 210mm; min-height: 297mm; padding: 25mm 20mm; box-sizing: border-box; background: #ffffff; margin: 0 auto; position: relative; }
    header { margin-bottom: 24px; border-bottom: 2px solid #0284c7; padding-bottom: 12px; }
    h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }
    h2 { font-size: 20px; font-weight: 600; color: #1e293b; margin: 24px 0 12px 0; }
    p { font-size: 14px; color: #334155; margin: 0 0 14px 0; }
    .callout { background: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 18px; border-radius: 4px; margin: 18px 0; }
    .callout p { margin: 0; font-size: 13.5px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <main class="page" id="page-1">
    <header>
      <h1>Introduction to Anatomy</h1>
      <p class="subtitle">Liberty Studio — Medical Lecture Series</p>
    </header>
    <section>
      <h2>1. Overview & Structural Hierarchy</h2>
      <p>Human anatomy is organized into macroscopic and microscopic systems. This document flows naturally according to standard physical paper dimensions, ensuring pixel-perfect print fidelity.</p>
      <div class="callout">
        <p><strong>Core Rule:</strong> HTML is the true document format. Visual page editing modifies the real semantic tree, keeping code portable, accessible, and clean.</p>
      </div>
      <h2>2. Functional Tissue Distribution</h2>
      <p>Muscle fibers and connective fascia adapt dynamically to physical stressors, arranging their myofibrils to optimize force transmission.</p>
      <table>
        <thead>
          <tr><th>Tissue Type</th><th>Primary Cell</th><th>Tensile Modulus</th></tr>
        </thead>
        <tbody>
          <tr><td>Skeletal Muscle</td><td>Myocyte</td><td>12.5 kPa</td></tr>
          <tr><td>Hyaline Cartilage</td><td>Chondrocyte</td><td>0.8 MPa</td></tr>
          <tr><td>Cortical Bone</td><td>Osteocyte</td><td>18 GPa</td></tr>
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;

export const useDocumentStore = create<DocState>((set) => ({
  fileName: "Untitled",
  dirty: false,
  writeHtml: "",
  sheet: {},
  slides: [newSlide()],
  currentSlide: 0,
  designShapes: [],
  pdfBuffer: null,
  pdfName: "",
  // html studio initial state
  htmlDoc: DEFAULT_HTML_DOC,
  htmlPreset: "a4-portrait",
  htmlMode: "flow",
  htmlEditMode: "design",
  htmlZoom: 1.0,
  htmlSelectedId: null,

  setFileName: (n) => set({ fileName: n }),
  setDirty: (d) => set({ dirty: d }),
  setWriteHtml: (h) => set({ writeHtml: h, dirty: true }),
  setSheetCell: (id, v) =>
    set((s) => ({ sheet: { ...s.sheet, [id]: v }, dirty: true })),
  setSheet: (data) => set({ sheet: data, dirty: true }),
  setSlides: (slides) => set({ slides, dirty: true }),
  setCurrentSlide: (i) => set({ currentSlide: i }),
  setDesignShapes: (s) => set({ designShapes: s, dirty: true }),
  addDesignShape: (shape) => set((s) => ({ designShapes: [...s.designShapes, shape], dirty: true })),
  addSlide: () =>
    set((s) => ({
      slides: [...s.slides, newSlide()],
      currentSlide: s.slides.length,
      dirty: true,
    })),
  deleteSlide: (i) =>
    set((s) => {
      if (s.slides.length <= 1) return s;
      const slides = s.slides.filter((_, idx) => idx !== i);
      return { slides, currentSlide: Math.max(0, i - 1), dirty: true };
    }),
  updateSlide: (i, patch) =>
    set((s) => ({
      slides: s.slides.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)),
      dirty: true,
    })),
  setPdf: (buf, name) => set({ pdfBuffer: buf, pdfName: name }),
  // html studio actions
  setHtmlDoc: (html) => set({ htmlDoc: html, dirty: true }),
  setHtmlPreset: (preset) => set({ htmlPreset: preset, dirty: true }),
  setHtmlMode: (mode) => set({ htmlMode: mode, dirty: true }),
  setHtmlEditMode: (mode) => set({ htmlEditMode: mode }),
  setHtmlZoom: (zoom) => set({ htmlZoom: zoom }),
  setHtmlSelectedId: (id) => set({ htmlSelectedId: id }),
}));
