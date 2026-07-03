import type { ReactNode } from "react";

interface AppShellProps {
  sidebar: ReactNode;
  ribbon: ReactNode;
  content: ReactNode;
  statusBar: ReactNode;
}

/**
 * AppShell — Renders the main workspace shell using class names
 * defined in src/office/office.css to ensure pixel-perfect match
 * with the OfficeSuite layout.
 */
export function AppShell({ sidebar, ribbon, content, statusBar }: AppShellProps) {
  return (
    <div className="app-container">
      {sidebar}
      <div className="main-workspace">
        {ribbon}
        {content}
        {statusBar}
      </div>
    </div>
  );
}
