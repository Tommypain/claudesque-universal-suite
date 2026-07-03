import type { ReactNode } from "react";

interface LibertyRibbonGroupProps {
  label: string;
  children: ReactNode;
}

/**
 * LibertyRibbonGroup — a labelled group of controls inside the Liberty Ribbon.
 * Renders using the lib-group / lib-group-body / lib-group-label CSS classes
 * defined in theme.css.
 */
export function LibertyRibbonGroup({ label, children }: LibertyRibbonGroupProps) {
  return (
    <div className="lib-group">
      <div className="lib-group-body">{children}</div>
      <div className="lib-group-label">{label}</div>
    </div>
  );
}
