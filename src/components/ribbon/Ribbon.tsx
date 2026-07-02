import { useState, type ReactNode } from "react";

export interface RibbonTabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export function Ribbon({ tabs }: { tabs: RibbonTabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div className="oct-ribbon">
      <div className="oct-ribbon-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`oct-ribbon-tab${t.id === current?.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="oct-ribbon-body">{current?.content}</div>
    </div>
  );
}
