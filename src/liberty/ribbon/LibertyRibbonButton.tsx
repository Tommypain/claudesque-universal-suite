import type { ReactNode } from "react";

interface LibertyRibbonButtonProps {
  /** Icon content — pass a lucide-react icon element or a string/emoji */
  icon?: ReactNode;
  /** Optional text label shown below the icon (large size only) */
  label?: string;
  /** Button size variant */
  size?: "small" | "large";
  /** Whether the button is in a pressed/active state */
  pressed?: boolean;
  /** Accessible label (aria-label) */
  title?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * LibertyRibbonButton — a single control inside the Liberty Ribbon.
 * Applies the `lib-ctrl` class (+ `pressed` when active) defined in theme.css.
 * Supports small (icon-only) and large (icon + label) variants.
 */
export function LibertyRibbonButton({
  icon,
  label,
  size = "small",
  pressed = false,
  title,
  onClick,
  className = "",
}: LibertyRibbonButtonProps) {
  const cls = [
    "lib-ctrl",
    size === "large" ? "lib-ctrl--large" : "",
    pressed ? "pressed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={cls}
      aria-pressed={pressed}
      aria-label={title}
      title={title}
      onClick={onClick}
    >
      {icon && <span className="lib-ctrl-icon">{icon}</span>}
      {label && size === "large" && <span className="lib-ctrl-label">{label}</span>}
    </button>
  );
}
