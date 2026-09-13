import { useState, useRef, useEffect } from "react";

type ThumbSize = "normal" | "medium" | "small" | "Small" | "Medium" | "Large";

const THUMB_DIMS: Record<string, { w: number; h: number }> = {
  normal: { w: 160, h: 226 },
  medium: { w: 130, h: 184 },
  small:  { w: 96,  h: 135 },
  Large:  { w: 160, h: 226 },
  Medium: { w: 130, h: 184 },
  Small:  { w: 96,  h: 135 },
};

const THUMB_SIZES: { id: "normal" | "medium" | "small"; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "medium", label: "Medium" },
  { id: "small", label: "Small" },
];

interface RightPanelProps {
  open: boolean;
  glass: boolean;
  thumbSize: ThumbSize;
  pageCount: number;
  onThumbSizeChange: (s: any) => void;
}

/**
 * RightPanel — collapsible right panel showing page thumbnails with virtualization.
 */
export function RightPanel({
  open,
  glass,
  thumbSize,
  pageCount,
  onThumbSizeChange,
}: RightPanelProps) {
  const raw = String(thumbSize || "normal").toLowerCase();
  const normalizedSize = (raw === "large" ? "normal" : raw) as "normal" | "medium" | "small";
  const dims = THUMB_DIMS[normalizedSize] || THUMB_DIMS.normal;
  const itemHeight = dims.h + 10;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const cls = [
    "lib-rightpanel",
    open ? "" : "collapsed",
    glass ? "glass-surface" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Virtualization for large page counts (100 to 1000+)
  const clientHeight = containerRef.current?.clientHeight || 600;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
  const endIndex = Math.min(pageCount - 1, Math.ceil((scrollTop + clientHeight) / itemHeight) + 3);

  const topPadding = startIndex * itemHeight;
  const bottomPadding = Math.max(0, (pageCount - 1 - endIndex) * itemHeight);

  const visiblePages: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visiblePages.push(i + 1);
  }

  return (
    <aside className={cls} aria-label="Page thumbnails">
      <div className="lib-rightpanel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid var(--border-color, rgba(0,0,0,0.1))" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted, #888)" }}>Pages ({pageCount})</span>
        <div className="lib-segmented" role="group" aria-label="Thumbnail size">
          {THUMB_SIZES.map((s) => (
            <button
              key={s.id}
              aria-pressed={normalizedSize === s.id}
              className={normalizedSize === s.id ? "active" : ""}
              onClick={() => onThumbSizeChange(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="lib-thumbs" style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {topPadding > 0 && <div style={{ height: topPadding, width: "100%", flexShrink: 0 }} />}
        {visiblePages.map((pageNum) => (
          <div
            key={pageNum}
            className="liberty-thumb lib-thumb"
            style={{ width: "100%", height: dims.h, position: "relative", flexShrink: 0 }}
            aria-label={`Page ${pageNum}`}
          >
            <div className="liberty-thumb-badge" style={{ position: "absolute", top: 4, left: 6, zIndex: 2 }}>{pageNum}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #888)" }}>Page {pageNum}</div>
          </div>
        ))}
        {bottomPadding > 0 && <div style={{ height: bottomPadding, width: "100%", flexShrink: 0 }} />}
      </div>
    </aside>
  );
}

export type { ThumbSize };
