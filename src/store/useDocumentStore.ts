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
}));
