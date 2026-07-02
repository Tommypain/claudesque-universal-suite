import { useAppStore, type AppId } from "../../store/useAppStore";

const APPS: { id: AppId; icon: string; name: string }[] = [
  { id: "write", icon: "📝", name: "Write" },
  { id: "sheet", icon: "📊", name: "Sheet" },
  { id: "present", icon: "📽", name: "Present" },
  { id: "pdf", icon: "📄", name: "PDF" },
];

export function Sidebar() {
  const activeApp = useAppStore((s) => s.activeApp);
  const setActiveApp = useAppStore((s) => s.setActiveApp);
  const toggleSettings = useAppStore((s) => s.toggleSettings);

  return (
    <div className="oct-sidebar">
      <div className="oct-brand">🐙</div>
      {APPS.map((a) => (
        <button
          key={a.id}
          className={`oct-app-btn${a.id === activeApp ? " active" : ""}`}
          title={a.name}
          onClick={() => setActiveApp(a.id)}
        >
          {a.icon}
        </button>
      ))}
      <div className="oct-sidebar-spacer" />
      <button className="oct-app-btn" title="Settings" onClick={() => toggleSettings(true)}>
        ⚙
      </button>
    </div>
  );
}
