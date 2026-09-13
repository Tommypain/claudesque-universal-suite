/**
 * Octopus Studio — the entire office suite in ONE file.
 *
 * Word · Impress · Sheet · PDF — real paper-sized pages, working rulers,
 * per-app thumbnail rails, import/export, ribbon, status bar, shortcuts.
 *
 * Everything (styles, state, editors, file IO) lives in this file on purpose.
 */

import {
  createFileRoute,
  ClientOnly,
} from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Octopus Studio — Documents, Slides, Sheets & PDF" },
      {
        name: "description",
        content:
          "Octopus Studio is a single-file office suite: real A4 documents, 16:9 slides, spreadsheets with formulas and a PDF viewer, all in your browser.",
      },
      { property: "og:title", content: "Octopus Studio" },
      {
        property: "og:description",
        content:
          "Write documents, build slides, calculate in sheets and read PDFs — one fast browser workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudioRoute,
});

function StudioRoute() {
  return (
    <ClientOnly fallback={<div style={{ padding: 24, fontFamily: "system-ui" }}>Loading Octopus Studio…</div>}>
      <OctopusStudio />
    </ClientOnly>
  );
}

/* ═══════════════════════════════════════════════════════════
   1. CONSTANTS
   ═══════════════════════════════════════════════════════════ */

type AppId = "write" | "impress" | "sheet" | "pdf";

const ACCENT: Record<AppId, { base: string; soft: string; ink: string; label: string; glyph: string }> = {
  write: { base: "#2563eb", soft: "rgba(37,99,235,.12)", ink: "#1e40af", label: "Document", glyph: "W" },
  impress: { base: "#c2410c", soft: "rgba(194,65,12,.12)", ink: "#9a3412", label: "Slides", glyph: "P" },
  sheet: { base: "#15803d", soft: "rgba(21,128,61,.12)", ink: "#166534", label: "Sheet", glyph: "S" },
  pdf: { base: "#7c3aed", soft: "rgba(124,58,237,.12)", ink: "#6d28d9", label: "PDF", glyph: "F" },
};

/** 96 dpi paper geometry — the same numbers Word uses. */
const PX_PER_CM = 96 / 2.54; // 37.795
const PAGE = { w: 794, h: 1123, pad: 96 }; // A4 portrait @96dpi, 1in margins
const SLIDE = { w: 960, h: 540 }; // 16:9
const SHEET_COLS = 26;
const SHEET_ROWS = 80;

const CDN = {
  mammoth: "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js",
  xlsx: "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js",
  pdfjs: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
};

/* ═══════════════════════════════════════════════════════════
   2. UTILITIES
   ═══════════════════════════════════════════════════════════ */

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cdn="${src}"]`);
    if (existing) {
      if (existing.dataset.ready === "1") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("load failed")));
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.dataset.cdn = src;
    el.async = true;
    el.onload = () => {
      el.dataset.ready = "1";
      resolve();
    };
    el.onerror = () => reject(new Error("load failed"));
    document.head.appendChild(el);
  });
}

function colName(i: number) {
  let s = "";
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function cellId(col: number, row: number) {
  return `${colName(col)}${row + 1}`;
}

function parseRef(ref: string): { col: number; row: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref.trim().toUpperCase());
  if (!m) return null;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: parseInt(m[2], 10) - 1 };
}

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

/* ═══════════════════════════════════════════════════════════
   3. SPREADSHEET FORMULA ENGINE
   ═══════════════════════════════════════════════════════════ */

type SheetData = Record<string, string>;

function expandRange(a: string, b: string): string[] {
  const p1 = parseRef(a);
  const p2 = parseRef(b);
  if (!p1 || !p2) return [];
  const out: string[] = [];
  for (let r = Math.min(p1.row, p2.row); r <= Math.max(p1.row, p2.row); r++)
    for (let c = Math.min(p1.col, p2.col); c <= Math.max(p1.col, p2.col); c++) out.push(cellId(c, r));
  return out;
}

function numeric(data: SheetData, id: string, seen: Set<string>): number {
  const v = evalCell(data, id, seen);
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const AGGREGATES: Record<string, (v: number[]) => number> = {
  SUM: (v) => v.reduce((a, b) => a + b, 0),
  AVERAGE: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  AVG: (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0),
  MIN: (v) => (v.length ? Math.min(...v) : 0),
  MAX: (v) => (v.length ? Math.max(...v) : 0),
  COUNT: (v) => v.length,
  PRODUCT: (v) => v.reduce((a, b) => a * b, 1),
  MEDIAN: (v) => {
    if (!v.length) return 0;
    const s = [...v].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  },
};

function evalFormula(data: SheetData, src: string, seen: Set<string>): string {
  let expr = src;

  // Aggregate functions, innermost first.
  let guard = 0;
  while (guard++ < 40) {
    const m = /\b([A-Z]+)\(([^()]*)\)/i.exec(expr);
    if (!m) break;
    const fn = m[1].toUpperCase();
    const argsRaw = m[2];
    const agg = AGGREGATES[fn];
    if (!agg) {
      // Unknown function: math fallbacks
      const arg = argsRaw.trim();
      const val = evalFormula(data, arg, seen);
      const n = parseFloat(val);
      const map: Record<string, number> = {
        ABS: Math.abs(n),
        ROUND: Math.round(n),
        SQRT: Math.sqrt(n),
        INT: Math.trunc(n),
      };
      if (fn in map) {
        expr = expr.slice(0, m.index) + map[fn] + expr.slice(m.index + m[0].length);
        continue;
      }
      return "#NAME?";
    }
    const nums: number[] = [];
    for (const part of argsRaw.split(",")) {
      const token = part.trim();
      if (!token) continue;
      if (token.includes(":")) {
        const [a, b] = token.split(":");
        for (const id of expandRange(a, b)) {
          const raw = data[id];
          if (raw === undefined || raw === "") continue;
          nums.push(numeric(data, id, seen));
        }
      } else if (parseRef(token)) {
        nums.push(numeric(data, token.toUpperCase(), seen));
      } else {
        const n = parseFloat(token);
        if (Number.isFinite(n)) nums.push(n);
      }
    }
    expr = expr.slice(0, m.index) + agg(nums) + expr.slice(m.index + m[0].length);
  }

  // Replace bare cell refs
  expr = expr.replace(/\$?([A-Z]{1,2})\$?(\d{1,4})/g, (whole) => {
    const ref = whole.replace(/\$/g, "").toUpperCase();
    if (!parseRef(ref)) return whole;
    return String(numeric(data, ref, seen));
  });

  if (!/^[-+*/%^().,\s\d]*$/.test(expr)) return "#VALUE!";
  try {
    // eslint-disable-next-line no-new-func
    const out = Function(`"use strict";return (${expr.replace(/\^/g, "**") || 0})`)();
    if (typeof out !== "number" || !Number.isFinite(out)) return "#DIV/0!";
    return String(Math.round(out * 1e10) / 1e10);
  } catch {
    return "#VALUE!";
  }
}

function evalCell(data: SheetData, id: string, seen = new Set<string>()): string {
  const raw = data[id];
  if (raw === undefined) return "";
  if (!raw.startsWith("=")) return raw;
  if (seen.has(id)) return "#REF!";
  seen.add(id);
  const out = evalFormula(data, raw.slice(1), seen);
  seen.delete(id);
  return out;
}

/* ═══════════════════════════════════════════════════════════
   4. TYPES
   ═══════════════════════════════════════════════════════════ */

interface SlideBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  size: number;
  weight: number;
  align: "left" | "center" | "right";
  color: string;
  shape?: "rect" | "ellipse" | "line";
  fill?: string;
}

interface Slide {
  id: string;
  bg: string;
  boxes: SlideBox[];
}

interface PdfPage {
  kind: "canvas" | "html";
  dataUrl?: string;
  html?: string;
  w: number;
  h: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

function blankSlide(title = "Click to add title", sub = "Click to add subtitle"): Slide {
  return {
    id: uid(),
    bg: "#ffffff",
    boxes: [
      { id: uid(), x: 80, y: 150, w: 800, h: 90, text: title, size: 44, weight: 700, align: "center", color: "#111827" },
      { id: uid(), x: 140, y: 268, w: 680, h: 60, text: sub, size: 22, weight: 400, align: "center", color: "#4b5563" },
    ],
  };
}

/* ═══════════════════════════════════════════════════════════
   5. STYLES (scoped to .oct-root)
   ═══════════════════════════════════════════════════════════ */

const STYLES = `
.oct-root{--bg:#f4f4f3;--surface:#ffffff;--surface-2:#fbfbfa;--border:#e4e2dd;--border-strong:#d3d0c9;
  --text-1:#1f1e1c;--text-2:#57534e;--text-3:#8a857e;--accent:#2563eb;--accent-soft:rgba(37,99,235,.12);
  position:fixed;inset:0;display:flex;background:var(--bg);color:var(--text-1);
  font-family:ui-sans-serif,system-ui,"Segoe UI",Inter,sans-serif;font-size:13px;overflow:hidden;}
.oct-root *{box-sizing:border-box;}
.oct-root button{font:inherit;color:inherit;}

/* Sidebar */
.oct-rail{width:64px;flex:0 0 64px;background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0;z-index:5;}
.oct-brand{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-size:20px;
  background:var(--accent-soft);margin-bottom:6px;}
.oct-app{width:44px;height:44px;border:none;border-radius:12px;background:transparent;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:background .15s,transform .1s;}
.oct-app:hover{background:var(--surface-2);}
.oct-app:active{transform:scale(.94);}
.oct-app span.g{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:12px;}
.oct-app span.t{font-size:9px;color:var(--text-3);letter-spacing:.02em;}
.oct-app[data-active="true"]{background:var(--accent-soft);}
.oct-app[data-active="true"] span.t{color:var(--accent);font-weight:600;}

/* Main column */
.oct-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.oct-titlebar{height:40px;flex:0 0 40px;display:flex;align-items:center;gap:10px;padding:0 12px;
  background:var(--surface);border-bottom:1px solid var(--border);}
.oct-file{font-weight:600;letter-spacing:-.01em;}
.oct-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);}
.oct-titlebar .sp{flex:1;}
.oct-chip{border:1px solid var(--border);background:var(--surface);border-radius:8px;padding:5px 11px;
  cursor:pointer;color:var(--text-2);transition:background .15s,border-color .15s;}
.oct-chip:hover{background:var(--surface-2);border-color:var(--border-strong);}
.oct-chip.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600;}

/* Ribbon */
.oct-tabs{height:36px;flex:0 0 36px;display:flex;gap:2px;align-items:flex-end;padding:0 10px;
  background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none;}
.oct-tabs::-webkit-scrollbar{display:none;}
.oct-tab{border:none;background:none;padding:7px 13px;border-radius:8px 8px 0 0;cursor:pointer;
  color:var(--text-2);white-space:nowrap;}
.oct-tab:hover{background:var(--surface-2);}
.oct-tab[data-active="true"]{color:var(--accent);font-weight:600;box-shadow:inset 0 -2px 0 var(--accent);}
.oct-ribbon{flex:0 0 auto;display:flex;gap:0;align-items:stretch;padding:8px 10px;background:var(--surface);
  border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:thin;}
.oct-group{display:flex;flex-direction:column;gap:5px;padding:0 12px;border-right:1px solid var(--border);}
.oct-group:last-child{border-right:none;}
.oct-group-row{display:flex;gap:4px;align-items:center;flex-wrap:wrap;max-width:420px;}
.oct-group-label{font-size:10px;color:var(--text-3);text-align:center;}
.oct-btn{min-width:30px;height:30px;padding:0 8px;border:1px solid transparent;background:transparent;
  border-radius:8px;cursor:pointer;color:var(--text-1);display:inline-flex;align-items:center;gap:5px;
  white-space:nowrap;transition:background .12s,border-color .12s,transform .08s;}
.oct-btn:hover{background:var(--surface-2);border-color:var(--border);}
.oct-btn:active{transform:scale(.95);background:var(--accent-soft);}
.oct-btn[data-on="true"]{background:var(--accent-soft);color:var(--accent);border-color:transparent;}
.oct-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px;}
.oct-sel,.oct-input{height:30px;border:1px solid var(--border);border-radius:8px;background:var(--surface);
  padding:0 8px;color:var(--text-1);}
.oct-swatch{width:26px;height:26px;border-radius:7px;border:1px solid var(--border-strong);cursor:pointer;padding:0;}

/* Workspace */
.oct-work{flex:1;min-height:0;display:flex;}
.oct-rail-thumbs{width:180px;flex:0 0 180px;background:var(--surface-2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;min-height:0;}
.oct-thumbs-head{padding:8px 10px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;
  color:var(--text-3);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.oct-thumbs-body{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:10px;}
.oct-thumb{border:none;background:none;padding:0;cursor:pointer;display:flex;gap:7px;align-items:flex-start;text-align:left;}
.oct-thumb .num{font-size:10px;color:var(--text-3);width:14px;padding-top:2px;flex:0 0 14px;text-align:right;}
.oct-thumb .frame{flex:1;background:#fff;border:1px solid var(--border-strong);border-radius:4px;overflow:hidden;
  position:relative;transition:box-shadow .15s,border-color .15s;}
.oct-thumb:hover .frame{border-color:var(--accent);}
.oct-thumb[data-active="true"] .frame{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft);}
.oct-thumb .frame .mini{position:absolute;inset:0;transform-origin:top left;pointer-events:none;overflow:hidden;}

.oct-canvas{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg);}

/* Rulers */
.oct-ruler-h{height:22px;flex:0 0 22px;background:var(--surface);border-bottom:1px solid var(--border);
  position:relative;overflow:hidden;}
.oct-ruler-v{width:22px;flex:0 0 22px;background:var(--surface);border-right:1px solid var(--border);
  position:relative;overflow:hidden;}
.oct-rk{position:absolute;background:var(--border-strong);}
.oct-rl{position:absolute;font-size:9px;color:var(--text-3);line-height:1;}
.oct-ruler-h .band{position:absolute;top:0;bottom:0;background:var(--accent-soft);}

/* Pages */
.oct-scroll{flex:1;min-height:0;overflow:auto;padding:26px 0 60px;}
.oct-stack{display:flex;flex-direction:column;align-items:center;gap:22px;}
.oct-page{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.09),0 10px 28px rgba(0,0,0,.07);
  border-radius:2px;position:relative;}
.oct-page-body{width:100%;height:100%;outline:none;overflow:hidden;
  font-family:Georgia,"Times New Roman",serif;font-size:16px;line-height:1.65;color:#111;}
.oct-page-body:empty:before{content:attr(data-ph);color:#b9b4ac;}

/* Slides */
.oct-slide{background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1),0 14px 34px rgba(0,0,0,.09);position:relative;overflow:hidden;}
.oct-box{position:absolute;outline:none;padding:4px 6px;border:1px dashed transparent;border-radius:3px;cursor:text;}
.oct-box:hover{border-color:var(--border-strong);}
.oct-box[data-sel="true"]{border:1px solid var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}
.oct-box .grip{position:absolute;right:-5px;bottom:-5px;width:10px;height:10px;background:var(--accent);
  border:2px solid #fff;border-radius:50%;cursor:nwse-resize;}
.oct-box .mover{position:absolute;left:0;right:0;top:-16px;height:14px;cursor:move;}

/* Sheet */
.oct-formula{height:34px;flex:0 0 34px;display:flex;align-items:center;gap:8px;padding:0 10px;
  background:var(--surface);border-bottom:1px solid var(--border);}
.oct-addr{width:64px;height:24px;border:1px solid var(--border);border-radius:6px;display:grid;place-items:center;
  font-weight:600;font-variant-numeric:tabular-nums;}
.oct-fx{flex:1;height:24px;border:1px solid var(--border);border-radius:6px;padding:0 8px;background:var(--surface);
  font-family:ui-monospace,monospace;}
.oct-grid-wrap{flex:1;min-height:0;overflow:auto;background:var(--surface);}
.oct-grid{border-collapse:separate;border-spacing:0;font-variant-numeric:tabular-nums;}
.oct-grid th{position:sticky;background:var(--surface-2);border:1px solid var(--border);font-weight:500;
  font-size:11px;color:var(--text-2);height:24px;min-width:34px;z-index:2;}
.oct-grid thead th{top:0;}
.oct-grid tbody th{left:0;width:44px;min-width:44px;z-index:1;}
.oct-grid td{border:1px solid var(--border);padding:0;height:26px;min-width:96px;}
.oct-grid td input{width:100%;height:100%;border:none;background:transparent;padding:0 6px;outline:none;color:var(--text-1);}
.oct-grid td[data-sel="true"]{outline:2px solid var(--accent);outline-offset:-2px;}
.oct-grid td[data-num="true"] input{text-align:right;}

/* Status bar */
.oct-status{height:28px;flex:0 0 28px;display:flex;align-items:center;gap:14px;padding:0 12px;
  background:var(--surface);border-top:1px solid var(--border);color:var(--text-2);font-size:11px;}
.oct-status .sp{flex:1;}
.oct-status .pill{background:var(--accent-soft);color:var(--accent);border-radius:999px;padding:2px 9px;font-weight:600;}

/* Toasts */
.oct-toasts{position:fixed;bottom:44px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;
  gap:7px;z-index:60;pointer-events:none;}
.oct-toast{background:#1f1e1c;color:#fff;padding:8px 15px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);}

@media (max-width:900px){
  .oct-rail{width:54px;flex-basis:54px;}
  .oct-rail-thumbs{width:120px;flex-basis:120px;}
  .oct-group-row{max-width:none;}
  .oct-scroll{padding:14px 0 60px;}
}
@media (max-width:620px){
  .oct-rail-thumbs{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .oct-root *{transition:none!important;animation:none!important;}
}
`;

/* ═══════════════════════════════════════════════════════════
   6. SMALL PRESENTATIONAL PIECES
   ═══════════════════════════════════════════════════════════ */

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="oct-group">
      <div className="oct-group-row">{children}</div>
      <div className="oct-group-label">{label}</div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  title,
  on,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  on?: boolean;
}) {
  return (
    <button
      className="oct-btn"
      type="button"
      title={title}
      aria-label={title}
      data-on={on ? "true" : undefined}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Horizontal ruler in real centimetres, aware of zoom and page geometry. */
function RulerH({ width, zoom, marginPx }: { width: number; zoom: number; marginPx: number }) {
  const step = PX_PER_CM * zoom;
  const count = Math.floor(width / step);
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= count; i++) {
    const x = i * step;
    ticks.push(<div key={`t${i}`} className="oct-rk" style={{ left: x, top: 6, width: 1, height: 16 }} />);
    if (i > 0) ticks.push(<div key={`l${i}`} className="oct-rl" style={{ left: x + 3, top: 6 }}>{i}</div>);
    const half = x + step / 2;
    if (half < width) ticks.push(<div key={`h${i}`} className="oct-rk" style={{ left: half, top: 13, width: 1, height: 9 }} />);
  }
  return (
    <div className="oct-ruler-h" role="presentation">
      <div style={{ position: "absolute", left: 0, top: 0, width, height: "100%" }}>
        <div className="band" style={{ left: 0, width: marginPx * zoom }} />
        <div className="band" style={{ left: width - marginPx * zoom, width: marginPx * zoom }} />
        {ticks}
      </div>
    </div>
  );
}

function RulerV({ height, zoom }: { height: number; zoom: number }) {
  const step = PX_PER_CM * zoom;
  const count = Math.floor(height / step);
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= count; i++) {
    const y = i * step;
    ticks.push(<div key={`t${i}`} className="oct-rk" style={{ top: y, left: 6, height: 1, width: 16 }} />);
    if (i > 0) ticks.push(<div key={`l${i}`} className="oct-rl" style={{ top: y + 3, left: 4 }}>{i}</div>);
  }
  return (
    <div className="oct-ruler-v" role="presentation">
      <div style={{ position: "absolute", top: 0, left: 0, height, width: "100%" }}>{ticks}</div>
    </div>
  );
}

/** Thumbnail rail shared by every app — same sizing/colour rules everywhere. */
function ThumbRail({
  title,
  count,
  active,
  aspect,
  onSelect,
  render,
  footer,
}: {
  title: string;
  count: number;
  active: number;
  aspect: number; // width / height
  onSelect: (i: number) => void;
  render: (i: number, scale: number) => ReactNode;
  footer?: ReactNode;
}) {
  const frameW = 132;
  const frameH = Math.round(frameW / aspect);
  return (
    <aside className="oct-rail-thumbs">
      <div className="oct-thumbs-head">
        <span>{title}</span>
        <span>{count}</span>
      </div>
      <div className="oct-thumbs-body">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} className="oct-thumb" data-active={i === active ? "true" : "false"} onClick={() => onSelect(i)}>
            <span className="num">{i + 1}</span>
            <span className="frame" style={{ width: frameW, height: frameH }}>
              {render(i, frameW)}
            </span>
          </button>
        ))}
      </div>
      {footer ? <div style={{ padding: 8, borderTop: "1px solid var(--border)" }}>{footer}</div> : null}
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   7. THE SUITE
   ═══════════════════════════════════════════════════════════ */

function OctopusStudio() {
  const [app, setApp] = useState<AppId>("write");
  const [tab, setTab] = useState("home");
  const [zoom, setZoom] = useState(1);
  const [fileName, setFileName] = useState("Untitled");
  const [dirty, setDirty] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);

  // Word
  const [pages, setPages] = useState<string[]>([""]);
  const [activePage, setActivePage] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Impress
  const [slides, setSlides] = useState<Slide[]>([blankSlide()]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selBox, setSelBox] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // Sheet
  const [sheet, setSheet] = useState<SheetData>({});
  const [selCell, setSelCell] = useState("A1");
  const [fxDraft, setFxDraft] = useState("");

  // PDF
  const [pdfPages, setPdfPages] = useState<PdfPage[]>([]);
  const [pdfActive, setPdfActive] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const accent = ACCENT[app];

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400);
  }, []);

  /* ── theme variables follow the active app ── */
  const rootStyle = {
    "--accent": accent.base,
    "--accent-soft": accent.soft,
  } as CSSProperties;

  /* ── default ribbon tab per app ── */
  useEffect(() => {
    setTab("home");
  }, [app]);

  /* ── restore + autosave ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("octopus-studio-v1");
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.pages) && s.pages.length) setPages(s.pages);
      if (Array.isArray(s.slides) && s.slides.length) setSlides(s.slides);
      if (s.sheet && typeof s.sheet === "object") setSheet(s.sheet);
      if (typeof s.fileName === "string") setFileName(s.fileName);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const t = setInterval(() => {
      try {
        localStorage.setItem("octopus-studio-v1", JSON.stringify({ pages, slides, sheet, fileName }));
        setDirty(false);
        toast("Autosaved");
      } catch {
        /* ignore */
      }
    }, 30000);
    return () => clearInterval(t);
  }, [dirty, pages, slides, sheet, fileName, toast]);

  const markDirty = useCallback(() => setDirty(true), []);

  /* ── word helpers ── */
  const exec = useCallback(
    (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      pageRefs.current[activePage]?.focus();
      markDirty();
    },
    [activePage, markDirty],
  );

  const syncPage = useCallback(
    (i: number) => {
      const el = pageRefs.current[i];
      if (!el) return;
      setPages((p) => {
        const next = [...p];
        next[i] = el.innerHTML;
        return next;
      });
      markDirty();
    },
    [markDirty],
  );

  const addPage = useCallback(() => {
    setPages((p) => [...p, ""]);
    setActivePage(pages.length);
    markDirty();
  }, [pages.length, markDirty]);

  /* ── slide helpers ── */
  const patchSlide = useCallback(
    (i: number, patch: Partial<Slide>) => {
      setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
      markDirty();
    },
    [markDirty],
  );

  const patchBox = useCallback(
    (boxId: string, patch: Partial<SlideBox>) => {
      setSlides((s) =>
        s.map((sl, idx) =>
          idx === activeSlide ? { ...sl, boxes: sl.boxes.map((b) => (b.id === boxId ? { ...b, ...patch } : b)) } : sl,
        ),
      );
      markDirty();
    },
    [activeSlide, markDirty],
  );

  const addBox = useCallback(
    (partial: Partial<SlideBox>) => {
      const box: SlideBox = {
        id: uid(),
        x: 120,
        y: 120,
        w: 320,
        h: 90,
        text: partial.shape ? "" : "New text box",
        size: 20,
        weight: 400,
        align: "left",
        color: "#111827",
        ...partial,
      };
      setSlides((s) => s.map((sl, idx) => (idx === activeSlide ? { ...sl, boxes: [...sl.boxes, box] } : sl)));
      setSelBox(box.id);
      markDirty();
    },
    [activeSlide, markDirty],
  );

  const deleteBox = useCallback(() => {
    if (!selBox) return;
    setSlides((s) =>
      s.map((sl, idx) => (idx === activeSlide ? { ...sl, boxes: sl.boxes.filter((b) => b.id !== selBox) } : sl)),
    );
    setSelBox(null);
    markDirty();
  }, [selBox, activeSlide, markDirty]);

  /* ── sheet helpers ── */
  const setCell = useCallback(
    (id: string, v: string) => {
      setSheet((s) => {
        const next = { ...s };
        if (v === "") delete next[id];
        else next[id] = v;
        return next;
      });
      markDirty();
    },
    [markDirty],
  );

  useEffect(() => {
    setFxDraft(sheet[selCell] ?? "");
  }, [selCell, sheet]);

  /* ── import ── */
  const openFile = useCallback(
    async (file: File) => {
      const name = file.name;
      const ext = (name.split(".").pop() || "").toLowerCase();
      setFileName(name.replace(/\.[^.]+$/, ""));
      try {
        if (ext === "pdf") {
          await loadScript(CDN.pdfjs);
          const pdfjs = (window as any).pdfjsLib;
          pdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
          const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
          const out: PdfPage[] = [];
          for (let i = 1; i <= doc.numPages; i++) {
            const p = await doc.getPage(i);
            const vp = p.getViewport({ scale: 1.6 });
            const canvas = document.createElement("canvas");
            canvas.width = vp.width;
            canvas.height = vp.height;
            await p.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
            out.push({ kind: "canvas", dataUrl: canvas.toDataURL("image/jpeg", 0.85), w: vp.width, h: vp.height });
          }
          setPdfPages(out);
          setPdfActive(0);
          setApp("pdf");
          toast(`Opened ${doc.numPages} page${doc.numPages > 1 ? "s" : ""}`);
          return;
        }

        if (ext === "docx") {
          await loadScript(CDN.mammoth);
          const res = await (window as any).mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
          setPages(splitHtmlToPages(res.value));
          setActivePage(0);
          setApp("write");
          toast("Document imported");
          return;
        }

        if (["xlsx", "xls", "ods"].includes(ext)) {
          await loadScript(CDN.xlsx);
          const XLSX = (window as any).XLSX;
          const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
          const data: SheetData = {};
          rows.forEach((row, r) =>
            row.forEach((v, c) => {
              if (v !== undefined && v !== null && v !== "") data[cellId(c, r)] = String(v);
            }),
          );
          setSheet(data);
          setApp("sheet");
          toast(`Imported ${rows.length} rows`);
          return;
        }

        if (ext === "csv" || ext === "tsv") {
          const text = await file.text();
          const sepr = ext === "tsv" ? "\t" : ",";
          const data: SheetData = {};
          text.split(/\r?\n/).forEach((line, r) => {
            if (!line) return;
            splitCsvLine(line, sepr).forEach((v, c) => {
              if (v !== "") data[cellId(c, r)] = v;
            });
          });
          setSheet(data);
          setApp("sheet");
          toast("Spreadsheet imported");
          return;
        }

        if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(ext)) {
          const url = await readAsDataUrl(file);
          setPages([`<p><img src="${url}" style="max-width:100%"/></p>`]);
          setApp("write");
          toast("Image placed in document");
          return;
        }

        if (ext === "json") {
          const text = await file.text();
          setPages([`<pre style="font-family:ui-monospace,monospace;font-size:13px">${escapeHtml(
            JSON.stringify(JSON.parse(text), null, 2),
          )}</pre>`]);
          setApp("write");
          toast("JSON opened");
          return;
        }

        if (ext === "pptx") {
          toast("PPTX: opening text outline");
          const text = await file.text().catch(() => "");
          const lines = (text.match(/<a:t>([^<]*)<\/a:t>/g) || [])
            .map((m) => m.replace(/<\/?a:t>/g, ""))
            .filter(Boolean);
          setSlides(
            lines.length
              ? chunk(lines, 6).map((grp) => blankSlide(grp[0] || "Slide", grp.slice(1).join("\n")))
              : [blankSlide()],
          );
          setActiveSlide(0);
          setApp("impress");
          return;
        }

        // text-ish fallback
        const text = await file.text();
        if (/^\s*</.test(text)) setPages(splitHtmlToPages(text));
        else
          setPages([
            text
              .split(/\n{2,}/)
              .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
              .join(""),
          ]);
        setApp("write");
        toast("File opened");
      } catch (err) {
        toast("Could not read that file");
        console.error(err);
      }
    },
    [toast],
  );

  /* ── export ── */
  const save = useCallback(() => {
    if (app === "write") {
      const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(fileName)}</title>
<style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;line-height:1.65}</style>
${pages.join('<hr style="page-break-after:always;border:none">')}`;
      download(`${fileName}.html`, html, "text/html");
    } else if (app === "sheet") {
      const maxCol = Math.max(0, ...Object.keys(sheet).map((k) => parseRef(k)?.col ?? 0));
      const maxRow = Math.max(0, ...Object.keys(sheet).map((k) => parseRef(k)?.row ?? 0));
      const lines: string[] = [];
      for (let r = 0; r <= maxRow; r++) {
        const row: string[] = [];
        for (let c = 0; c <= maxCol; c++) {
          const v = evalCell(sheet, cellId(c, r));
          row.push(/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
        }
        lines.push(row.join(","));
      }
      download(`${fileName}.csv`, lines.join("\n"), "text/csv");
    } else if (app === "impress") {
      const html = slides
        .map(
          (s) =>
            `<section style="position:relative;width:960px;height:540px;background:${s.bg};margin:0 auto 24px;box-shadow:0 2px 12px rgba(0,0,0,.15)">` +
            s.boxes
              .map((b) =>
                b.shape
                  ? `<div style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;background:${b.fill || "#e5e7eb"};border-radius:${b.shape === "ellipse" ? "50%" : "4px"}"></div>`
                  : `<div style="position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;font-size:${b.size}px;font-weight:${b.weight};text-align:${b.align};color:${b.color};white-space:pre-wrap">${escapeHtml(b.text)}</div>`,
              )
              .join("") +
            `</section>`,
        )
        .join("");
      download(
        `${fileName}.html`,
        `<!doctype html><meta charset="utf-8"><title>${escapeHtml(fileName)}</title><body style="background:#f4f4f3;padding:24px">${html}`,
        "text/html",
      );
    } else {
      window.print();
      return;
    }
    setDirty(false);
    toast("Exported");
  }, [app, fileName, pages, sheet, slides, toast]);

  /* ── shortcuts ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        if (e.key === "Escape" && playing) setPlaying(false);
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        save();
      } else if (k === "o") {
        e.preventDefault();
        fileInput.current?.click();
      } else if (k === "b" && app === "write") {
        e.preventDefault();
        exec("bold");
      } else if (k === "i" && app === "write") {
        e.preventDefault();
        exec("italic");
      } else if (k === "u" && app === "write") {
        e.preventDefault();
        exec("underline");
      } else if (k === "z") {
        e.preventDefault();
        document.execCommand("undo");
      } else if (k === "y") {
        e.preventDefault();
        document.execCommand("redo");
      } else if (k === "=" || k === "+") {
        e.preventDefault();
        setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)));
      } else if (k === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [app, exec, save, playing]);

  /* ── slideshow ── */
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setActiveSlide((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === "ArrowLeft") setActiveSlide((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, slides.length]);

  /* ── derived status ── */
  const wordCount = useMemo(() => {
    const text = pages.join(" ").replace(/<[^>]+>/g, " ");
    return (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
  }, [pages]);

  const filledCells = useMemo(() => Object.keys(sheet).length, [sheet]);

  /* ═════ RENDER ═════ */

  if (playing) {
    const s = slides[activeSlide];
    return (
      <div
        className="oct-root"
        style={{ ...rootStyle, background: "#0c0a09", display: "grid", placeItems: "center" }}
        onClick={() => setActiveSlide((i) => (i + 1 < slides.length ? i + 1 : i))}
      >
        <style>{STYLES}</style>
        <SlideCanvas slide={s} scale={Math.min(window.innerWidth / SLIDE.w, window.innerHeight / SLIDE.h) * 0.94} />
        <div style={{ position: "fixed", bottom: 16, right: 20, color: "#a8a29e", fontSize: 12 }}>
          {activeSlide + 1} / {slides.length} · Esc to exit
        </div>
      </div>
    );
  }

  return (
    <div className="oct-root" style={rootStyle}>
      <style>{STYLES}</style>
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) openFile(f);
          e.target.value = "";
        }}
      />

      {/* Sidebar */}
      <nav className="oct-rail" aria-label="Applications">
        <div className="oct-brand" aria-hidden>🐙</div>
        {(Object.keys(ACCENT) as AppId[]).map((id) => (
          <button
            key={id}
            className="oct-app"
            data-active={app === id ? "true" : "false"}
            onClick={() => setApp(id)}
            aria-current={app === id}
          >
            <span className="g" style={{ background: ACCENT[id].base }}>{ACCENT[id].glyph}</span>
            <span className="t">{ACCENT[id].label}</span>
          </button>
        ))}
      </nav>

      <div className="oct-main">
        {/* Title bar */}
        <div className="oct-titlebar">
          <input
            className="oct-file"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              markDirty();
            }}
            style={{ border: "none", background: "transparent", outline: "none", width: 200 }}
            aria-label="File name"
          />
          {dirty ? <span className="oct-dot" title="Unsaved changes" /> : null}
          <span className="sp" />
          <button className="oct-chip" onClick={() => fileInput.current?.click()}>Open</button>
          <button className="oct-chip primary" onClick={save}>
            {app === "pdf" ? "Print / PDF" : "Export"}
          </button>
        </div>

        {/* Ribbon */}
        <div className="oct-tabs" role="tablist">
          {ribbonTabs(app).map((t) => (
            <button
              key={t.id}
              className="oct-tab"
              role="tab"
              data-active={tab === t.id ? "true" : "false"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="oct-ribbon">
          {app === "write" && (
            <WriteRibbon tab={tab} exec={exec} addPage={addPage} onOpen={() => fileInput.current?.click()} save={save} />
          )}
          {app === "impress" && (
            <ImpressRibbon
              tab={tab}
              slide={slides[activeSlide]}
              addSlide={() => {
                setSlides((s) => [...s, blankSlide()]);
                setActiveSlide(slides.length);
                markDirty();
              }}
              removeSlide={() => {
                if (slides.length <= 1) return;
                setSlides((s) => s.filter((_, i) => i !== activeSlide));
                setActiveSlide(Math.max(0, activeSlide - 1));
                markDirty();
              }}
              addBox={addBox}
              patchBox={(p) => selBox && patchBox(selBox, p)}
              deleteBox={deleteBox}
              setBg={(bg) => patchSlide(activeSlide, { bg })}
              play={() => setPlaying(true)}
              onOpen={() => fileInput.current?.click()}
            />
          )}
          {app === "sheet" && (
            <SheetRibbon
              tab={tab}
              insertFormula={(fn) => {
                setFxDraft(`=${fn}()`);
                setCell(selCell, `=${fn}()`);
              }}
              clearCell={() => setCell(selCell, "")}
              onOpen={() => fileInput.current?.click()}
              save={save}
            />
          )}
          {app === "pdf" && (
            <PdfRibbon
              tab={tab}
              count={pdfPages.length}
              onOpen={() => fileInput.current?.click()}
              addBlank={() => {
                setPdfPages((p) => [...p, { kind: "html", html: "", w: PAGE.w, h: PAGE.h }]);
                markDirty();
              }}
              clearAll={() => setPdfPages([])}
              print={() => window.print()}
            />
          )}
        </div>

        {/* Workspace */}
        <div className="oct-work">
          {app === "write" && (
            <>
              <ThumbRail
                title="Pages"
                count={pages.length}
                active={activePage}
                aspect={PAGE.w / PAGE.h}
                onSelect={(i) => {
                  setActivePage(i);
                  pageRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                render={(i, w) => (
                  <span
                    className="mini"
                    style={{ width: PAGE.w, height: PAGE.h, transform: `scale(${w / PAGE.w})`, background: "#fff" }}
                  >
                    <span
                      style={{
                        display: "block",
                        padding: PAGE.pad,
                        fontFamily: "Georgia, serif",
                        fontSize: 16,
                        lineHeight: 1.6,
                        color: "#111",
                      }}
                      dangerouslySetInnerHTML={{ __html: pages[i] || "" }}
                    />
                  </span>
                )}
                footer={
                  <button className="oct-chip" style={{ width: "100%" }} onClick={addPage}>
                    + Page
                  </button>
                }
              />
              <div className="oct-canvas">
                <div style={{ display: "flex" }}>
                  <div style={{ width: 22, flex: "0 0 22px", background: "var(--surface)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
                  <div style={{ flex: 1, display: "flex", justifyContent: "center", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <RulerH width={PAGE.w * zoom} zoom={zoom} marginPx={PAGE.pad} />
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
                  <RulerV height={PAGE.h * zoom} zoom={zoom} />
                  <div className="oct-scroll">
                    <div className="oct-stack">
                      {pages.map((html, i) => (
                        <div
                          key={i}
                          className="oct-page"
                          style={{
                            width: PAGE.w * zoom,
                            height: PAGE.h * zoom,
                            outline: i === activePage ? `2px solid ${accent.soft}` : "none",
                          }}
                          onClick={() => setActivePage(i)}
                        >
                          <div
                            ref={(el) => {
                              pageRefs.current[i] = el;
                            }}
                            className="oct-page-body"
                            data-ph={i === 0 ? "Start typing…" : ""}
                            contentEditable
                            suppressContentEditableWarning
                            dir="auto"
                            onInput={() => syncPage(i)}
                            onFocus={() => setActivePage(i)}
                            style={{
                              padding: PAGE.pad,
                              width: PAGE.w,
                              height: PAGE.h,
                              transform: `scale(${zoom})`,
                              transformOrigin: "top left",
                            }}
                            dangerouslySetInnerHTML={{ __html: html }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {app === "impress" && (
            <>
              <ThumbRail
                title="Slides"
                count={slides.length}
                active={activeSlide}
                aspect={SLIDE.w / SLIDE.h}
                onSelect={(i) => {
                  setActiveSlide(i);
                  setSelBox(null);
                }}
                render={(i, w) => <SlideCanvas slide={slides[i]} scale={w / SLIDE.w} inThumb />}
                footer={
                  <button
                    className="oct-chip"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setSlides((s) => [...s, blankSlide()]);
                      setActiveSlide(slides.length);
                      markDirty();
                    }}
                  >
                    + Slide
                  </button>
                }
              />
              <div className="oct-canvas">
                <div className="oct-scroll" style={{ display: "grid", placeItems: "center" }}>
                  <SlideEditor
                    slide={slides[activeSlide]}
                    scale={zoom}
                    selBox={selBox}
                    setSelBox={setSelBox}
                    patchBox={patchBox}
                  />
                </div>
              </div>
            </>
          )}

          {app === "sheet" && (
            <div className="oct-canvas">
              <div className="oct-formula">
                <span className="oct-addr">{selCell}</span>
                <input
                  className="oct-fx"
                  value={fxDraft}
                  placeholder="Value or =SUM(A1:A10)"
                  onChange={(e) => setFxDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCell(selCell, fxDraft);
                      const p = parseRef(selCell);
                      if (p) setSelCell(cellId(p.col, Math.min(SHEET_ROWS - 1, p.row + 1)));
                    }
                  }}
                  onBlur={() => setCell(selCell, fxDraft)}
                />
              </div>
              <div className="oct-grid-wrap">
                <SheetGrid data={sheet} sel={selCell} setSel={setSelCell} setCell={setCell} />
              </div>
            </div>
          )}

          {app === "pdf" && (
            <>
              <ThumbRail
                title="Pages"
                count={Math.max(pdfPages.length, 1)}
                active={pdfActive}
                aspect={pdfPages[0] ? pdfPages[0].w / pdfPages[0].h : PAGE.w / PAGE.h}
                onSelect={setPdfActive}
                render={(i, w) => {
                  const p = pdfPages[i];
                  if (!p) return <span className="mini" style={{ background: "#fff" }} />;
                  return p.kind === "canvas" ? (
                    <img src={p.dataUrl} alt="" style={{ width: "100%", display: "block" }} />
                  ) : (
                    <span
                      className="mini"
                      style={{ width: PAGE.w, height: PAGE.h, transform: `scale(${w / PAGE.w})`, background: "#fff" }}
                    >
                      <span style={{ display: "block", padding: PAGE.pad, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: p.html || "" }} />
                    </span>
                  );
                }}
                footer={
                  <button className="oct-chip" style={{ width: "100%" }} onClick={() => fileInput.current?.click()}>
                    Open PDF
                  </button>
                }
              />
              <div className="oct-canvas">
                <div className="oct-scroll">
                  <div className="oct-stack">
                    {(pdfPages.length ? pdfPages : [{ kind: "html", html: "", w: PAGE.w, h: PAGE.h } as PdfPage]).map(
                      (p, i) => (
                        <div
                          key={i}
                          className="oct-page"
                          style={{ width: (p.kind === "canvas" ? p.w : PAGE.w) * zoom, height: (p.kind === "canvas" ? p.h : PAGE.h) * zoom }}
                          onClick={() => setPdfActive(i)}
                        >
                          {p.kind === "canvas" ? (
                            <img src={p.dataUrl} alt={`Page ${i + 1}`} style={{ width: "100%", height: "100%", display: "block" }} />
                          ) : (
                            <div
                              className="oct-page-body"
                              contentEditable
                              suppressContentEditableWarning
                              dir="auto"
                              data-ph="Blank page — type or open a PDF"
                              style={{
                                padding: PAGE.pad,
                                width: PAGE.w,
                                height: PAGE.h,
                                transform: `scale(${zoom})`,
                                transformOrigin: "top left",
                              }}
                              onInput={(e) => {
                                const html = (e.target as HTMLDivElement).innerHTML;
                                setPdfPages((prev) => {
                                  const next = prev.length ? [...prev] : [{ kind: "html", html: "", w: PAGE.w, h: PAGE.h } as PdfPage];
                                  next[i] = { ...next[i], html };
                                  return next;
                                });
                                markDirty();
                              }}
                            />
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="oct-status">
          <span className="pill">{accent.label}</span>
          <span>{fileName}</span>
          {app === "write" && <span>{pages.length} pages · {wordCount} words</span>}
          {app === "impress" && <span>Slide {activeSlide + 1} of {slides.length}</span>}
          {app === "sheet" && <span>{selCell} · {filledCells} cells</span>}
          {app === "pdf" && <span>{pdfPages.length || 1} pages</span>}
          <span className="sp" />
          <span>{dirty ? "Unsaved" : "Saved"}</span>
          <button className="oct-btn" style={{ height: 22 }} onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))} aria-label="Zoom out">
            −
          </button>
          <span style={{ width: 42, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button className="oct-btn" style={{ height: 22 }} onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>

      <div className="oct-toasts">
        {toasts.map((t) => (
          <div className="oct-toast" key={t.id}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   8. RIBBONS
   ═══════════════════════════════════════════════════════════ */

function ribbonTabs(app: AppId) {
  if (app === "write")
    return [
      { id: "home", label: "Home" },
      { id: "insert", label: "Insert" },
      { id: "layout", label: "Layout" },
      { id: "file", label: "File" },
    ];
  if (app === "impress")
    return [
      { id: "home", label: "Home" },
      { id: "insert", label: "Insert" },
      { id: "design", label: "Design" },
      { id: "show", label: "Slide Show" },
    ];
  if (app === "sheet")
    return [
      { id: "home", label: "Home" },
      { id: "formulas", label: "Formulas" },
      { id: "file", label: "File" },
    ];
  return [
    { id: "home", label: "Home" },
    { id: "pages", label: "Pages" },
  ];
}

function WriteRibbon({
  tab,
  exec,
  addPage,
  onOpen,
  save,
}: {
  tab: string;
  exec: (c: string, v?: string) => void;
  addPage: () => void;
  onOpen: () => void;
  save: () => void;
}) {
  if (tab === "insert")
    return (
      <>
        <Group label="Insert">
          <Btn title="Table" onClick={() => {
            const dim = prompt("Table size (rows x columns)", "3x3") || "";
            const [r, c] = dim.split(/[x×,\s]+/).map((n) => Math.min(12, Math.max(1, parseInt(n, 10) || 2)));
            let html = '<table style="border-collapse:collapse;width:100%">';
            for (let i = 0; i < (r || 2); i++) {
              html += "<tr>";
              for (let j = 0; j < (c || 2); j++) html += '<td style="border:1px solid #d4d4d4;padding:6px">&nbsp;</td>';
              html += "</tr>";
            }
            exec("insertHTML", html + "</table>");
          }}>▦ Table</Btn>
          <Btn title="Picture" onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const f = input.files?.[0];
              if (!f) return;
              exec("insertHTML", `<img src="${await readAsDataUrl(f)}" style="max-width:100%">`);
            };
            input.click();
          }}>🖼 Picture</Btn>
          <Btn title="Link" onClick={() => {
            const url = prompt("Link URL", "https://");
            if (url) exec("createLink", url);
          }}>🔗 Link</Btn>
          <Btn title="Horizontal rule" onClick={() => exec("insertHorizontalRule")}>— Rule</Btn>
          <Btn title="New page" onClick={addPage}>＋ Page</Btn>
        </Group>
      </>
    );
  if (tab === "layout")
    return (
      <Group label="Paragraph">
        <Btn title="Align left" onClick={() => exec("justifyLeft")}>⯇</Btn>
        <Btn title="Center" onClick={() => exec("justifyCenter")}>≡</Btn>
        <Btn title="Align right" onClick={() => exec("justifyRight")}>⯈</Btn>
        <Btn title="Justify" onClick={() => exec("justifyFull")}>▤</Btn>
        <Btn title="Indent" onClick={() => exec("indent")}>⇥</Btn>
        <Btn title="Outdent" onClick={() => exec("outdent")}>⇤</Btn>
      </Group>
    );
  if (tab === "file")
    return (
      <Group label="File">
        <Btn title="Open" onClick={onOpen}>📂 Open</Btn>
        <Btn title="Export" onClick={save}>⬇ Export</Btn>
        <Btn title="Print" onClick={() => window.print()}>🖨 Print</Btn>
      </Group>
    );
  return (
    <>
      <Group label="Clipboard">
        <Btn title="Cut" onClick={() => exec("cut")}>✂</Btn>
        <Btn title="Copy" onClick={() => exec("copy")}>⧉</Btn>
        <Btn title="Paste as text" onClick={async () => {
          try {
            exec("insertText", await navigator.clipboard.readText());
          } catch {
            /* clipboard blocked */
          }
        }}>📋</Btn>
      </Group>
      <Group label="Font">
        <select className="oct-sel" defaultValue="Georgia" onChange={(e) => exec("fontName", e.target.value)}>
          {["Georgia", "Times New Roman", "Arial", "Helvetica", "Verdana", "Courier New", "Tahoma"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select className="oct-sel" defaultValue="3" onChange={(e) => exec("fontSize", e.target.value)}>
          {[["1", "10"], ["2", "13"], ["3", "16"], ["4", "18"], ["5", "24"], ["6", "32"], ["7", "48"]].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <Btn title="Bold" onClick={() => exec("bold")}><b>B</b></Btn>
        <Btn title="Italic" onClick={() => exec("italic")}><i>I</i></Btn>
        <Btn title="Underline" onClick={() => exec("underline")}><u>U</u></Btn>
        <Btn title="Strikethrough" onClick={() => exec("strikeThrough")}><s>S</s></Btn>
        <input className="oct-swatch" type="color" defaultValue="#111111" title="Text colour" onChange={(e) => exec("foreColor", e.target.value)} />
        <input className="oct-swatch" type="color" defaultValue="#fff59d" title="Highlight" onChange={(e) => exec("hiliteColor", e.target.value)} />
      </Group>
      <Group label="Paragraph">
        <Btn title="Bullets" onClick={() => exec("insertUnorderedList")}>• List</Btn>
        <Btn title="Numbering" onClick={() => exec("insertOrderedList")}>1. List</Btn>
        <select className="oct-sel" defaultValue="p" onChange={(e) => exec("formatBlock", e.target.value)}>
          <option value="p">Body</option>
          <option value="h1">Title</option>
          <option value="h2">Heading 1</option>
          <option value="h3">Heading 2</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </select>
        <Btn title="Clear formatting" onClick={() => exec("removeFormat")}>⌫ Clear</Btn>
      </Group>
    </>
  );
}

function ImpressRibbon({
  tab,
  slide,
  addSlide,
  removeSlide,
  addBox,
  patchBox,
  deleteBox,
  setBg,
  play,
  onOpen,
}: {
  tab: string;
  slide: Slide | undefined;
  addSlide: () => void;
  removeSlide: () => void;
  addBox: (p: Partial<SlideBox>) => void;
  patchBox: (p: Partial<SlideBox>) => void;
  deleteBox: () => void;
  setBg: (c: string) => void;
  play: () => void;
  onOpen: () => void;
}) {
  if (tab === "insert")
    return (
      <>
        <Group label="Text">
          <Btn title="Text box" onClick={() => addBox({})}>T Text box</Btn>
          <Btn title="Heading" onClick={() => addBox({ text: "Heading", size: 36, weight: 700 })}>H Heading</Btn>
        </Group>
        <Group label="Shapes">
          <Btn title="Rectangle" onClick={() => addBox({ shape: "rect", fill: "#dbeafe", w: 220, h: 140 })}>▭</Btn>
          <Btn title="Ellipse" onClick={() => addBox({ shape: "ellipse", fill: "#fee2e2", w: 180, h: 180 })}>◯</Btn>
          <Btn title="Line" onClick={() => addBox({ shape: "line", fill: "#374151", w: 260, h: 4 })}>─</Btn>
        </Group>
        <Group label="Media">
          <Btn title="Picture" onClick={onOpen}>🖼 Picture</Btn>
        </Group>
      </>
    );
  if (tab === "design")
    return (
      <Group label="Slide background">
        {["#ffffff", "#0f172a", "#f5f5f4", "#fef3c7", "#dcfce7", "#e0e7ff"].map((c) => (
          <button
            key={c}
            className="oct-swatch"
            style={{ background: c }}
            title={c}
            onClick={() => setBg(c)}
            data-on={slide?.bg === c ? "true" : undefined}
          />
        ))}
        <input className="oct-swatch" type="color" value={slide?.bg || "#ffffff"} onChange={(e) => setBg(e.target.value)} title="Custom" />
      </Group>
    );
  if (tab === "show")
    return (
      <Group label="Slide show">
        <Btn title="Play from start" onClick={play}>▶ Play</Btn>
      </Group>
    );
  return (
    <>
      <Group label="Slides">
        <Btn title="New slide" onClick={addSlide}>＋ New</Btn>
        <Btn title="Delete slide" onClick={removeSlide}>🗑 Delete</Btn>
        <Btn title="Play" onClick={play}>▶ Play</Btn>
      </Group>
      <Group label="Selected object">
        <Btn title="Bigger text" onClick={() => patchBox({ size: 32 })}>A+</Btn>
        <Btn title="Smaller text" onClick={() => patchBox({ size: 16 })}>A−</Btn>
        <Btn title="Bold" onClick={() => patchBox({ weight: 700 })}><b>B</b></Btn>
        <Btn title="Regular" onClick={() => patchBox({ weight: 400 })}>R</Btn>
        <Btn title="Left" onClick={() => patchBox({ align: "left" })}>⯇</Btn>
        <Btn title="Center" onClick={() => patchBox({ align: "center" })}>≡</Btn>
        <Btn title="Right" onClick={() => patchBox({ align: "right" })}>⯈</Btn>
        <input className="oct-swatch" type="color" defaultValue="#111827" title="Colour" onChange={(e) => patchBox({ color: e.target.value, fill: e.target.value })} />
        <Btn title="Delete object" onClick={deleteBox}>🗑</Btn>
      </Group>
    </>
  );
}

function SheetRibbon({
  tab,
  insertFormula,
  clearCell,
  onOpen,
  save,
}: {
  tab: string;
  insertFormula: (fn: string) => void;
  clearCell: () => void;
  onOpen: () => void;
  save: () => void;
}) {
  if (tab === "formulas")
    return (
      <Group label="Functions">
        {["SUM", "AVERAGE", "MIN", "MAX", "COUNT", "MEDIAN", "PRODUCT"].map((f) => (
          <Btn key={f} title={f} onClick={() => insertFormula(f)}>{f}</Btn>
        ))}
      </Group>
    );
  if (tab === "file")
    return (
      <Group label="File">
        <Btn title="Open" onClick={onOpen}>📂 Open</Btn>
        <Btn title="Export CSV" onClick={save}>⬇ CSV</Btn>
      </Group>
    );
  return (
    <>
      <Group label="Cells">
        <Btn title="Clear cell" onClick={clearCell}>⌫ Clear</Btn>
        <Btn title="Sum column" onClick={() => insertFormula("SUM")}>Σ Sum</Btn>
      </Group>
      <Group label="File">
        <Btn title="Open" onClick={onOpen}>📂 Open</Btn>
        <Btn title="Export CSV" onClick={save}>⬇ CSV</Btn>
      </Group>
    </>
  );
}

function PdfRibbon({
  tab,
  count,
  onOpen,
  addBlank,
  clearAll,
  print,
}: {
  tab: string;
  count: number;
  onOpen: () => void;
  addBlank: () => void;
  clearAll: () => void;
  print: () => void;
}) {
  if (tab === "pages")
    return (
      <Group label="Pages">
        <Btn title="Blank page" onClick={addBlank}>＋ Blank</Btn>
        <Btn title="Close document" onClick={clearAll}>✕ Close</Btn>
        <span style={{ color: "var(--text-3)", fontSize: 11, alignSelf: "center" }}>{count} loaded</span>
      </Group>
    );
  return (
    <Group label="Document">
      <Btn title="Open PDF" onClick={onOpen}>📂 Open</Btn>
      <Btn title="Print or save as PDF" onClick={print}>🖨 Print / PDF</Btn>
    </Group>
  );
}

/* ═══════════════════════════════════════════════════════════
   9. SLIDE RENDERERS
   ═══════════════════════════════════════════════════════════ */

function boxStyle(b: SlideBox): CSSProperties {
  if (b.shape)
    return {
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      background: b.fill || "#e5e7eb",
      borderRadius: b.shape === "ellipse" ? "50%" : 3,
    };
  return {
    left: b.x,
    top: b.y,
    width: b.w,
    minHeight: b.h,
    fontSize: b.size,
    fontWeight: b.weight,
    textAlign: b.align,
    color: b.color,
    whiteSpace: "pre-wrap",
    lineHeight: 1.25,
  };
}

/** Read-only slide render, used by thumbnails and slideshow. */
function SlideCanvas({ slide, scale, inThumb }: { slide?: Slide; scale: number; inThumb?: boolean }) {
  if (!slide) return null;
  return (
    <div
      className={inThumb ? "mini" : "oct-slide"}
      style={{
        width: SLIDE.w,
        height: SLIDE.h,
        background: slide.bg,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: inThumb ? "absolute" : "relative",
        flex: "none",
      }}
    >
      {slide.boxes.map((b) => (
        <div key={b.id} style={{ position: "absolute", ...boxStyle(b) }}>
          {b.shape ? null : b.text}
        </div>
      ))}
    </div>
  );
}

/** Editable slide with drag + resize. */
function SlideEditor({
  slide,
  scale,
  selBox,
  setSelBox,
  patchBox,
}: {
  slide?: Slide;
  scale: number;
  selBox: string | null;
  setSelBox: (id: string | null) => void;
  patchBox: (id: string, p: Partial<SlideBox>) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; mode: "move" | "resize"; sx: number; sy: number; box: SlideBox } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.sx) / scale;
      const dy = (e.clientY - d.sy) / scale;
      if (d.mode === "move")
        patchBox(d.id, {
          x: Math.max(0, Math.min(SLIDE.w - 20, Math.round(d.box.x + dx))),
          y: Math.max(0, Math.min(SLIDE.h - 20, Math.round(d.box.y + dy))),
        });
      else
        patchBox(d.id, {
          w: Math.max(40, Math.round(d.box.w + dx)),
          h: Math.max(24, Math.round(d.box.h + dy)),
        });
    };
    const up = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [scale, patchBox]);

  if (!slide) return null;

  return (
    <div
      ref={wrapRef}
      className="oct-slide"
      style={{ width: SLIDE.w * scale, height: SLIDE.h * scale, background: slide.bg, flex: "none" }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelBox(null);
      }}
    >
      <div style={{ width: SLIDE.w, height: SLIDE.h, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>
        {slide.boxes.map((b) => (
          <div
            key={b.id}
            className="oct-box"
            data-sel={selBox === b.id ? "true" : "false"}
            style={boxStyle(b)}
            onPointerDown={(e) => {
              setSelBox(b.id);
              if (b.shape) {
                drag.current = { id: b.id, mode: "move", sx: e.clientX, sy: e.clientY, box: b };
              }
            }}
            contentEditable={!b.shape}
            suppressContentEditableWarning
            dir="auto"
            onBlur={(e) => !b.shape && patchBox(b.id, { text: (e.target as HTMLElement).innerText })}
          >
            {b.shape ? null : b.text}
            {selBox === b.id && (
              <>
                {!b.shape && (
                  <span
                    className="mover"
                    contentEditable={false}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      drag.current = { id: b.id, mode: "move", sx: e.clientX, sy: e.clientY, box: b };
                    }}
                  />
                )}
                <span
                  className="grip"
                  contentEditable={false}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    drag.current = { id: b.id, mode: "resize", sx: e.clientX, sy: e.clientY, box: b };
                  }}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   10. SHEET GRID
   ═══════════════════════════════════════════════════════════ */

function SheetGrid({
  data,
  sel,
  setSel,
  setCell,
}: {
  data: SheetData;
  sel: string;
  setSel: (id: string) => void;
  setCell: (id: string, v: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <table className="oct-grid">
      <thead>
        <tr>
          <th style={{ left: 0, zIndex: 3 }} />
          {Array.from({ length: SHEET_COLS }, (_, c) => (
            <th key={c}>{colName(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: SHEET_ROWS }, (_, r) => (
          <tr key={r}>
            <th>{r + 1}</th>
            {Array.from({ length: SHEET_COLS }, (_, c) => {
              const id = cellId(c, r);
              const shown = editing === id ? draft : evalCell(data, id);
              const isNum = editing !== id && shown !== "" && Number.isFinite(parseFloat(shown));
              return (
                <td key={c} data-sel={sel === id ? "true" : undefined} data-num={isNum ? "true" : undefined} onClick={() => setSel(id)}>
                  <input
                    value={shown}
                    dir="auto"
                    onFocus={() => {
                      setSel(id);
                      setEditing(id);
                      setDraft(data[id] ?? "");
                    }}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      if (editing === id) setCell(id, draft);
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setCell(id, draft);
                        setEditing(null);
                        (e.target as HTMLInputElement).blur();
                        setSel(cellId(c, Math.min(SHEET_ROWS - 1, r + 1)));
                      } else if (e.key === "Escape") {
                        setEditing(null);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ═══════════════════════════════════════════════════════════
   11. FILE HELPERS
   ═══════════════════════════════════════════════════════════ */

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function splitCsvLine(line: string, sep: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Split imported HTML into page-sized chunks so pagination stays real. */
function splitHtmlToPages(html: string): string[] {
  const host = document.createElement("div");
  host.innerHTML = html;
  const blocks = Array.from(host.children);
  if (!blocks.length) return [html || ""];

  const budget = PAGE.h - PAGE.pad * 2;
  const probe = document.createElement("div");
  probe.style.cssText = `position:fixed;left:-9999px;top:0;width:${PAGE.w - PAGE.pad * 2}px;font-family:Georgia,serif;font-size:16px;line-height:1.65;`;
  document.body.appendChild(probe);

  const out: string[] = [];
  let cur = "";
  for (const block of blocks) {
    probe.innerHTML = cur + block.outerHTML;
    if (probe.scrollHeight > budget && cur) {
      out.push(cur);
      cur = block.outerHTML;
    } else {
      cur += block.outerHTML;
    }
  }
  if (cur) out.push(cur);
  probe.remove();
  return out.length ? out : [html];
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
