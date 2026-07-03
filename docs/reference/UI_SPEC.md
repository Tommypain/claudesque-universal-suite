# UI Reference Specification

## The Official Visual Reference

The OfficeSuite application at the `/` route is the **canonical visual reference**
for all Liberty Studio applications. Every new application must match this reference.

## Reference Screenshot

The file `ui-reference.png` in this folder is the ground truth.
It was captured from the production OfficeSuite app.

> To update the reference: run the app, take a full-window screenshot, and save it here as `ui-reference.png`.

## Visual Specification (extracted from screenshot)

### Layout Regions

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR (dark ~#1f2937, height ~44px)  [icon buttons]          │
├─────────────────────────────────────────────────────────────────┤
│  RIBBON TAB BAR (height ~32px)  [Home] [Insert] [Draw]...       │
├─────────────────────────────────────────────────────────────────┤
│  RIBBON BODY (height ~88px)  [Groups: Clipboard | Font | ...]   │
├──────────┬──────────────────────────────────────┬───────────────┤
│ SIDEBAR  │         MAIN AREA                    │               │
│ (~60px)  │  ┌──────────────────────────────┐   │               │
│ [Word]   │  │  PAGES PANEL (~170px wide)   │   │               │
│ [Impress]│  │  [Page thumb] [Page thumb]   │   │               │
│ [Sheet]  │  └──────────────────────────────┘   │               │
│ [PDF]    │       DOCUMENT CANVAS                │               │
│          │   (grey bg, white pages centered)    │               │
│          │                                      │               │
│          │                                      │               │
├──────────┴──────────────────────────────────────┴───────────────┤
│  STATUS BAR (height ~28px)  [label | pages | words | zoom]      │
└─────────────────────────────────────────────────────────────────┘
```

### Colors

| Token | Value | Used for |
|-------|-------|----------|
| `--top-bar-bg` | `#1f2937` (approx dark grey) | Top bar background |
| `--sidebar-bg` | `#f3f4f6` (approx light grey) | Left sidebar |
| `--ribbon-bg` | `#ffffff` | Ribbon body |
| `--ribbon-tab-bar-bg` | `#f9fafb` | Tab bar row |
| `--ribbon-active-tab` | `#2563eb` (blue) | Active tab underline |
| `--canvas-bg` | `#e5e7eb` | Document canvas background |
| `--page-bg` | `#ffffff` | Document page |
| `--page-shadow` | `0 1px 4px rgba(0,0,0,0.18)` | Page box shadow |
| `--statusbar-bg` | `#f3f4f6` | Status bar background |
| `--statusbar-border` | `#d1d5db` | Status bar top border |
| `--text-primary` | `#111827` | Primary text |
| `--text-muted` | `#6b7280` | Secondary / muted text |
| `--accent` | `#2563eb` | Blue accent (active states) |

### Typography

| Context | Font | Size | Weight |
|---------|------|------|--------|
| Ribbon tab | System UI / Segoe UI | 13px | 400 |
| Ribbon group label | System UI | 11px | 400 |
| Ribbon button | System UI | 12px | 400 |
| Status bar | System UI | 12px | 400 |
| Document canvas | Calibri / Georgia | 16px | 400 |

### Spacing

| Region | Measurement |
|--------|------------|
| Sidebar width | ~60px |
| Top bar height | ~44px |
| Ribbon tab bar height | ~32px |
| Ribbon body height | ~88px |
| Pages panel width | ~170px |
| Status bar height | ~28px |
| Page margin (from canvas edge) | ~24px |
| Gap between pages | ~16px |

### Sidebar Icons

In order from top to bottom:
1. **Word** (document icon)
2. **Impress** (presentation icon)
3. **Sheet** (grid/table icon)
4. **PDF Edit** (PDF icon)

Active state: blue background or blue icon tint on the active app.

### Ribbon Groups (Home tab — Docs app)

Left to right:
1. **Clipboard** — Paste (large), Cut, Copy, Painter
2. **Font** — Font family dropdown, size, bold, italic, underline, strikethrough, sub/sup, color
3. **Paragraph** — Alignment (left/center/right/justify), indent, spacing, lists
4. **Preset Styles** — Normal, Heading 1, Heading 2, Copilot AI (or similar)
5. *(more groups as the app grows)*

Each group has:
- A thin vertical separator on the right
- A group label at the bottom center (e.g. "Clipboard", "Font")
- Controls in a 1–2 row grid above the label

### Status Bar Format

```
[WORD Workspace Active]    Pages: 1 of 2 | Words: 57      [Accessibility: Multi-Page Engine v3.5 (Fully Functional)]    100% 🔍
```

## Enforcement

Any new component added to the Liberty Suite must be compared against this spec.
If it does not match, it must be corrected before merging.

See `../architecture/UI_PRESERVATION.md` for the full enforcement policy.
