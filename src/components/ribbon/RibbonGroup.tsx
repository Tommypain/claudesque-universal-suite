import type { ReactNode } from "react";

export function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="oct-ribbon-group">
      <div className="oct-ribbon-group-items">{children}</div>
      <div className="oct-ribbon-group-label">{label}</div>
    </div>
  );
}
