import { FileText, Grid3x3, Presentation, FileType2, MessageSquare } from "lucide-react";

export type LibertyAppId = "write" | "sheet" | "impress" | "pdf" | "chat";

interface AppDef {
  id: LibertyAppId;
  label: string;
  icon: React.ElementType;
}

const MAIN_APPS: AppDef[] = [
  { id: "write",   label: "Docs",    icon: FileText },
  { id: "sheet",   label: "Sheets",  icon: Grid3x3 },
  { id: "impress", label: "Impress", icon: Presentation },
  { id: "pdf",     label: "PDF",     icon: FileType2 },
];

const CHAT_APP: AppDef = { id: "chat", label: "Chat", icon: MessageSquare };

interface AppSwitcherProps {
  activeApp: LibertyAppId;
  open: boolean;
  glass: boolean;
  onSelectApp: (id: LibertyAppId) => void;
}

/**
 * AppSwitcher — the left sidebar nav that switches between Liberty apps.
 * Collapsible via the `open` prop.
 */
export function AppSwitcher({ activeApp, open, glass, onSelectApp }: AppSwitcherProps) {
  const cls = [
    "lib-appbar",
    open ? "" : "collapsed",
    glass ? "glass-surface" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={cls} aria-label="Liberty applications">
      {MAIN_APPS.map((app) => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            className="lib-appbtn"
            aria-pressed={activeApp === app.id}
            aria-label={`Switch to ${app.label}`}
            onClick={() => onSelectApp(app.id)}
          >
            <Icon size={20} />
            {app.label}
          </button>
        );
      })}

      <div className="lib-appbar-spacer" />
      <div className="lib-appbar-divider" />

      <button
        className="lib-appbtn"
        aria-pressed={activeApp === CHAT_APP.id}
        aria-label="Switch to Chat"
        onClick={() => onSelectApp(CHAT_APP.id)}
      >
        <CHAT_APP.icon size={20} />
        {CHAT_APP.label}
      </button>
    </nav>
  );
}
