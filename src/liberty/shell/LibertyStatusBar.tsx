import type { LibertyAppId } from "./AppSwitcher";

interface LibertyStatusBarProps {
  activeApp: LibertyAppId;
  /** Word count — used in Docs app */
  wordCount?: number;
  /** Active cell address — used in Sheets app e.g. "A1" */
  cellAddress?: string;
  /** Current slide / total slides — used in Impress */
  slideInfo?: { current: number; total: number };
  /** Current page / total pages — used in Docs and PDF */
  pageInfo?: { current: number; total: number };
  /** Zoom level 0–100 */
  zoom?: number;
  /** Unsaved changes indicator */
  dirty?: boolean;
}

/**
 * LibertyStatusBar — bottom status bar showing contextual info per active app.
 *
 * Docs:    Page X / Y  |  N words  |  Zoom%
 * Sheets:  Cell A1     |  Formula bar preview  |  Zoom%
 * Impress: Slide X / Y |  Zoom%
 * PDF:     Page X / Y  |  Zoom%
 */
export function LibertyStatusBar({
  activeApp,
  wordCount,
  cellAddress,
  slideInfo,
  pageInfo,
  zoom = 100,
  dirty = false,
}: LibertyStatusBarProps) {
  return (
    <div className="lib-statusbar" role="status" aria-live="polite">
      <div className="lib-statusbar-left">
        {/* App-specific left section */}
        {activeApp === "write" && pageInfo && (
          <span className="lib-status-item">
            Page {pageInfo.current} / {pageInfo.total}
          </span>
        )}
        {activeApp === "sheet" && cellAddress && (
          <span className="lib-status-item lib-status-cell">{cellAddress}</span>
        )}
        {activeApp === "impress" && slideInfo && (
          <span className="lib-status-item">
            Slide {slideInfo.current} / {slideInfo.total}
          </span>
        )}
        {activeApp === "pdf" && pageInfo && (
          <span className="lib-status-item">
            Page {pageInfo.current} / {pageInfo.total}
          </span>
        )}
      </div>

      <div className="lib-statusbar-center">
        {activeApp === "write" && wordCount !== undefined && (
          <span className="lib-status-item">{wordCount.toLocaleString()} words</span>
        )}
        {dirty && <span className="lib-status-dirty">● Unsaved changes</span>}
      </div>

      <div className="lib-statusbar-right">
        <span className="lib-status-item">{zoom}%</span>
      </div>
    </div>
  );
}
