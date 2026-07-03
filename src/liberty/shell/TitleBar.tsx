import { PanelLeft, PanelRight } from "lucide-react";

interface TitleBarProps {
  appLabel: string;
  fileName: string;
  dirty: boolean;
  glass: boolean;
  onToggleAppBar: () => void;
  onToggleRightPanel: () => void;
}

/**
 * TitleBar — the Liberty Shell title bar.
 *
 *  [≡]  Liberty ·  [AppName]  — [FileName •]          [⊞]
 */
export function TitleBar({
  appLabel,
  fileName,
  dirty,
  glass,
  onToggleAppBar,
  onToggleRightPanel,
}: TitleBarProps) {
  return (
    <div className={"lib-titlebar" + (glass ? " glass-surface" : "")}>
      <button
        className="lib-iconbtn"
        onClick={onToggleAppBar}
        aria-label="Toggle app sidebar"
      >
        <PanelLeft size={15} />
      </button>

      <span className="lib-title-brandbar" />
      <span className="lib-title-app">Liberty {appLabel}</span>
      <span className="lib-title-sub">
        — {fileName}
        {dirty ? <span style={{ color: "var(--lib-accent, #6c8ebf)", marginLeft: 4 }}>●</span> : null}
      </span>

      <div className="lib-title-actions">
        <button
          className="lib-iconbtn"
          onClick={onToggleRightPanel}
          aria-label="Toggle right panel"
        >
          <PanelRight size={15} />
        </button>
      </div>
    </div>
  );
}
