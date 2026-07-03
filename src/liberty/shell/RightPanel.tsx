type ThumbSize = "Small" | "Medium" | "Large";

const THUMB_DIMS: Record<ThumbSize, { w: number; h: number }> = {
  Small:  { w: 96,  h: 128 },
  Medium: { w: 150, h: 200 },
  Large:  { w: 210, h: 280 },
};

const THUMB_SIZES: ThumbSize[] = ["Small", "Medium", "Large"];

interface RightPanelProps {
  open: boolean;
  glass: boolean;
  thumbSize: ThumbSize;
  pageCount: number;
  onThumbSizeChange: (s: ThumbSize) => void;
}

/**
 * RightPanel — collapsible right panel showing page thumbnails.
 * Used in Docs and Impress apps; other apps may override or hide it.
 */
export function RightPanel({
  open,
  glass,
  thumbSize,
  pageCount,
  onThumbSizeChange,
}: RightPanelProps) {
  const cls = [
    "lib-rightpanel",
    open ? "" : "collapsed",
    glass ? "glass-surface" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dims = THUMB_DIMS[thumbSize];

  return (
    <aside className={cls} aria-label="Page thumbnails">
      <div className="lib-rightpanel-head">
        <div className="lib-segmented" role="group" aria-label="Thumbnail size">
          {THUMB_SIZES.map((s) => (
            <button
              key={s}
              aria-pressed={thumbSize === s}
              onClick={() => onThumbSizeChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="lib-thumbs">
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i + 1}
            className="lib-thumb"
            style={{ width: dims.w, height: dims.h }}
            aria-label={`Page ${i + 1}`}
          >
            Page {i + 1}
          </div>
        ))}
      </div>
    </aside>
  );
}

export type { ThumbSize };
