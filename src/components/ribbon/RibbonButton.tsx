import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  size?: "small" | "normal" | "large";
  title?: string;
}

export function RibbonButton({
  icon,
  label,
  onClick,
  active,
  size = "normal",
  title,
}: Props) {
  // Use onMouseDown so contentEditable selection isn't lost before execCommand.
  return (
    <button
      className={`oct-rbtn ${size}${active ? " active" : ""}`}
      title={title ?? label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    >
      <span className="ic">{icon}</span>
      {label && size !== "small" ? <span>{label}</span> : null}
      {label && size === "small" ? <span>{label}</span> : null}
    </button>
  );
}
