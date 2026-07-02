interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function RibbonTab({ label, active, onClick }: Props) {
  return (
    <button
      className={`oct-ribbon-tab${active ? " active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
