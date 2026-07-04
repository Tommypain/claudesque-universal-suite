# Liberty Studio Plugin System Architecture & Sandbox Security

This document outlines how third-party plugins run inside the Liberty Studio environment under secure sandbox conditions.

---

## 1. Plugin Lifecycle & Manifest Schema

Each plugin must package a `manifest.json` file in its root directory containing metadata and sandbox permissions configuration:

```json
{
  "id": "translator-assistant",
  "name": "Translation Assistant",
  "version": "1.0.0",
  "description": "Translates document content offline.",
  "entry": "dist/index.js",
  "permissions": ["network", "notification"]
}
```

### Sandbox Permissions Scopes
- `filesystem`: Grants permission to read/write custom scratch files.
- `network`: Grants permission to establish HTTP socket connections.
- `clipboard`: Grants permission to copy/paste text structures.
- `notification`: Grants permission to trigger toast and notification banners.

---

## 2. C++ Manifest Security Validation

When a user attempts to install or update a plugin, the frontend passes the manifest JSON down to the native C++ `liberty::kernel::PluginManager`:

1. **Syntax Parsing**: Checks json parsing compatibility.
2. **Permissions Audit**: Scans for requests of sensitive scopes (`network`, `filesystem`).
3. **Status Code**: Returns validation warning headers if permissions exceed standard sandbox boundaries.

---

## 3. Sandboxed Runtime Context (`PluginContext`)

Plugins run inside a isolated environment with no access to direct browser globals (`window`, `document`, `fetch`) unless specifically declared. Instead, they interact via the `PluginContext` API:

- `showToast(message)`: Displays status updates.
- `getDocumentText()`: Reads current write application editor contents.
- `insertText(text)`: Inserts characters at active cursors.
- `getSpreadsheetCells()`: Retrieves sheets cells collection.
- `setSpreadsheetCells(cells)`: Updates active sheet spreadsheet.
- `getSandboxPermissions()`: Gets the active permission capabilities.
