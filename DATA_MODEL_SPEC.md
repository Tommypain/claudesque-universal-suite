# Liberty Studio AST Data Model Specification

This document defines the authoritative schema and node definitions for the Liberty Studio Abstract Syntax Tree (AST). All serialization and deserialization routines in the C++ engines and React/TypeScript frontends MUST adhere to this specification.

---

## 1. Document Data Model (`liberty-write`)

Documents are represented as a hierarchical tree of block-level and inline-level elements.

```
DocumentNode (root)
└── SectionNode
    ├── ParagraphNode
    │   ├── TextRun ("Hello ") [bold=true]
    │   └── TextRun ("world!") [italic=true]
    └── TableNode
        └── TableRow
            ├── TableCell -> ParagraphNode
            └── TableCell -> ParagraphNode
```

### 1.1 Node Schemas

#### DocumentNode
```json
{
  "type": "document",
  "version": "1.0.0",
  "children": [
    { "$ref": "SectionNode" }
  ]
}
```

#### ParagraphNode
```json
{
  "type": "paragraph",
  "style": {
    "alignment": "left" | "center" | "right" | "justify",
    "lineSpacing": 1.15,
    "spaceAfter": 6,
    "spaceBefore": 0
  },
  "children": [
    { "$ref": "TextRun" }
  ]
}
```

#### TextRun
```json
{
  "type": "text-run",
  "text": "String content",
  "style": {
    "bold": true,
    "italic": false,
    "underline": false,
    "color": "#111111",
    "fontSize": 11,
    "fontFamily": "Calibri"
  }
}
```

---

## 2. Spreadsheet Data Model (`liberty-sheet`)

Spreadsheets are stored as a map of cells inside a sheet container, keeping the memory layout flat and fast to query.

```
WorkbookNode (root)
└── SheetNode (list)
    ├── Name: "Sheet1"
    ├── GridConfig: Column/Row sizes
    └── Cells: Map<CellID, CellNode>
```

### 2.1 Node Schemas

#### CellNode
```json
{
  "raw": "=SUM(A1:A10)",
  "evaluated": "125.50",
  "type": "number" | "string" | "boolean" | "error",
  "style": {
    "bold": true,
    "italic": false,
    "color": "#15803d",
    "background": "#f0fdf4",
    "horizontalAlign": "right",
    "border": {
      "top": "1px solid #d8d4cc",
      "bottom": "2px double #d8d4cc"
    }
  }
}
```

#### SheetNode
```json
{
  "name": "Q3 Forecast",
  "colWidths": {
    "A": 120,
    "B": 150
  },
  "rowHeights": {
    "1": 24,
    "2": 20
  },
  "cells": {
    "A1": { "$ref": "CellNode" },
    "B1": { "$ref": "CellNode" }
  }
}
```

---

## 3. Presentation Data Model (`liberty-impress`)

Presentations store layouts, transition timings, and vector elements.

```
PresentationNode (root)
└── SlideNode (list)
    ├── Background styling
    ├── Transition config
    └── Elements: List<ShapeNode | TextFrameNode>
```

### 3.1 Node Schemas

#### SlideNode
```json
{
  "id": "slide_unique_hash",
  "bg": "#ffffff",
  "theme": "theme-plain" | "theme-dark" | "theme-colorful",
  "transition": {
    "type": "fade" | "slide" | "none",
    "duration": 0.5
  },
  "elements": [
    { "$ref": "ShapeNode" },
    { "$ref": "TextFrameNode" }
  ]
}
```

#### ShapeNode
```json
{
  "type": "shape",
  "shapeType": "rectangle" | "circle" | "triangle" | "line",
  "x": 100,
  "y": 150,
  "width": 200,
  "height": 100,
  "fill": "#3b82f6",
  "stroke": "#1d4ed8",
  "strokeWidth": 2
}
```

#### TextFrameNode
```json
{
  "type": "text-frame",
  "x": 80,
  "y": 80,
  "width": 400,
  "height": 200,
  "paragraphs": [
    { "$ref": "ParagraphNode" }
  ]
}
```
