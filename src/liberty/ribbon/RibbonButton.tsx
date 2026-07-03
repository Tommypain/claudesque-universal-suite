import type { ReactNode } from "react";

interface RibbonButtonProps {
  icon: ReactNode;
  label?: string;
  size?: "small" | "large";
  pressed?: boolean;
  title?: string;
  onClick?: () => void;
}

/**
 * RibbonButton — Renders a button in the ribbon matching the OfficeSuite visual styles
 * (`.btn`, `.blg` for large, `.bsm` for small).
 */
export function RibbonButton({
  icon,
  label,
  size = "small",
  pressed = false,
  title,
  onClick,
}: RibbonButtonProps) {
  const sizeClass = size === "large" ? "blg" : "bsm";
  return (
    <button
      className={`btn ${sizeClass} ${pressed ? "active" : ""}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className="ribbon-btn-icon" style={{ fontSize: size === "large" ? "20px" : "14px" }}>
        {icon}
      </span>
      {label && size === "large" && (
        <span dangerouslySetInnerHTML={{ __html: label.replace(" ", "<br>") }} />
      )}
    </button>
  );
}
