# Liberty Studio — Workspace Monorepo Project Structure

This document details the layout and boundaries of the Liberty Studio Monorepo structure, detailing packages, applications, and their mutual dependencies.

---

## 1. Directory Tree Overview

```
claudesque-universal-suite/ (root)
├── apps/
│   └── liberty-docs/                # Standalone Document Application [Stub]
├── packages/
│   ├── ui/                         # Shared OfficeSuite-matching visual components
│   ├── themes/                     # Visual CSS layouts and variables (office.css)
│   ├── icons/                      # Standardized app icon sets mapped to Lucide
│   ├── shared-hooks/               # Core Zustand state stores and document controllers
│   └── design-system/              # Design tokens and context managers (ThemeContext)
├── src/
│   ├── office/                     # Stable Frozen OfficeSuite (Omega reference)
│   ├── routes/                     # TanStack Start routing controllers
│   └── liberty/                    # App wrapper orchestrating child packages
├── package.json                    # Monorepo NPM workspace configuration
├── pnpm-workspace.yaml             # Workspace definitions
├── turbo.json                      # Monorepo pipeline configuration
└── CORE_ENGINE_ARCHITECTURE.md     # Native engine integration specifications
```

---

## 2. Package Boundaries & Roles

### 2.1 `@liberty/themes`
- **Location**: `packages/themes/`
- **Purpose**: Holds CSS styling files (`office.css`, `host.css`) defining variables, layout systems (Basic Capsule vs Liquid Glass), and core dark/light modes.

### 2.2 `@liberty/icons`
- **Location**: `packages/icons/`
- **Purpose**: Provides Lucide icon aliases mapped to standardized application commands and toolbar labels.

### 2.3 `@liberty/shared-hooks`
- **Location**: `packages/shared-hooks/`
- **Purpose**: Persists global Zustand stores (`useAppStore`, `useDocumentStore`) and shared controller hooks (`useFileManager`, `useKeyboard`, `useTheme`).

### 2.4 `@liberty/design-system`
- **Location**: `packages/design-system/`
- **Purpose**: Exposes theme context managers and state selectors for visual presets.

### 2.5 `@liberty/ui`
- **Location**: `packages/ui/`
- **Purpose**: Assembles visual layout components (AppShell, AppSidebar, Ribbon, RibbonGroup, RibbonButton, StatusBar, BackstageSettings) following the OfficeSuite specification.

---

## 3. Dependency Graph

```
                   +----------------------------+
                   |     Root application       |
                   +-------+------------+-------+
                           |            |
             +-------------+            +-------------+
             |                                        |
  +----------v-----------+                 +----------v-----------+
  |    @liberty/ui       |                 |@liberty/shared-hooks |
  +----+-----------+-----+                 +----------+-----------+
       |           |                                  |
  +----v----+ +----v----+                             |
  | @liberty| | @liberty| <---------------------------+
  |  icons  | | themes  |
  +---------+ +---------+
```
