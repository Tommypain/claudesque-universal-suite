/**
 * Liberty Studio Plugin SDK
 * Typings, Manifest Schemas, and Sandboxing Context APIs
 */

export type SandboxPermission = "filesystem" | "network" | "clipboard" | "notification";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  entry: string;
  permissions?: SandboxPermission[];
}

export interface PluginContext {
  // Common UI Actions
  showToast: (message: string) => void;
  
  // Document Operations
  getDocumentText: () => string;
  insertText: (text: string) => void;
  
  // Spreadsheet Operations
  getSpreadsheetCells: () => Record<string, any>;
  setSpreadsheetCells: (cells: Record<string, any>) => void;
  
  // Sandboxing Details
  getSandboxPermissions: () => SandboxPermission[];
  checkPermission: (perm: SandboxPermission) => boolean;
}

export interface LibertyPlugin {
  manifest: PluginManifest;
  onActivate: (ctx: PluginContext) => void;
  onDeactivate: (ctx: PluginContext) => void;
}
