import type { ReactNode } from "react";

interface RibbonGroupProps {
  label: string;
  children: ReactNode;
}

/**
 * RibbonGroup — Renders a ribbon group matching the OfficeSuite visual styles
 * (`.rg`, `.rgr`, `.rgl`).
 */
export function RibbonGroup({ label, children }: RibbonGroupProps) {
  return (
    <div className="rg">
      <div className="rgr" style={{ gap: "4px" }}>
        {children}
      </div>
      <div className="rgl">{label}</div>
    </div>
  );
}
