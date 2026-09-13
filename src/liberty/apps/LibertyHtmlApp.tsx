import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Ribbon, RibbonGroup, RibbonButton, type RibbonTabDef } from "@liberty/ui";
import {
  useDocumentStore,
  useAppStore,
  type HtmlPagePreset,
  type HtmlPageMode,
  type HtmlEditMode,
  DEFAULT_HTML_DOC,
} from "@liberty/shared-hooks";
import {
  FileCode,
  Layout,
  Columns,
  Eye,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Download,
  Printer,
  Grid,
  Ruler,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Check,
} from "lucide-react";

interface LibertyHtmlAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

interface SelectedElementData {
  tagName: string;
  id: string;
  className: string;
  text: string;
  computed: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
    margin: string;
    padding: string;
    width: string;
    height: string;
    borderRadius: string;
    border: string;
    display: string;
  };
}

export function LibertyHtmlApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyHtmlAppProps) {
  const htmlDoc = useDocumentStore((s) => s.htmlDoc || DEFAULT_HTML_DOC);
  const setHtmlDoc = useDocumentStore((s) => s.setHtmlDoc);
  const htmlPreset = useDocumentStore((s) => s.htmlPreset);
  const setHtmlPreset = useDocumentStore((s) => s.setHtmlPreset);
  const htmlMode = useDocumentStore((s) => s.htmlMode);
  const setHtmlMode = useDocumentStore((s) => s.setHtmlMode);
  const htmlEditMode = useDocumentStore((s) => s.htmlEditMode);
  const setHtmlEditMode = useDocumentStore((s) => s.setHtmlEditMode);
  const htmlZoom = useDocumentStore((s) => s.htmlZoom);
  const setHtmlZoom = useDocumentStore((s) => s.setHtmlZoom);
  const setDirty = useDocumentStore((s) => s.setDirty);
  const addToast = useAppStore((s) => s.addToast);

  // Local state for UI controls
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedEl, setSelectedEl] = useState<SelectedElementData | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<HTMLElement | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Code editor buffer
  const [codeBuffer, setCodeBuffer] = useState(htmlDoc);

  // References
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize external changes into codeBuffer
  useEffect(() => {
    setCodeBuffer(htmlDoc);
  }, [htmlDoc]);

  // Dimension helpers based on preset
  const presetDimensions = useMemo(() => {
    switch (htmlPreset) {
      case "a4-portrait":
        return { width: "210mm", minHeight: "297mm", aspect: 210 / 297, label: "A4 Portrait (210×297 mm)" };
      case "a4-landscape":
        return { width: "297mm", minHeight: "210mm", aspect: 297 / 210, label: "A4 Landscape (297×210 mm)" };
      case "slide-16-9":
        return { width: "960px", minHeight: "540px", aspect: 16 / 9, label: "Slide 16:9 (Widescreen)" };
      case "slide-4-3":
        return { width: "800px", minHeight: "600px", aspect: 4 / 3, label: "Slide 4:3 (Standard)" };
      default:
        return { width: "210mm", minHeight: "297mm", aspect: 210 / 297, label: "Custom Document" };
    }
  }, [htmlPreset]);

  // Parse HTML into pages or sections
  const pagesList = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlDoc, "text/html");
      const pageElements = doc.querySelectorAll(".page, .slide, section.page");
      if (pageElements.length > 0) {
        return Array.from(pageElements).map((el, i) => ({
          id: el.id || `page-${i + 1}`,
          title: el.querySelector("h1, h2, .slide-title")?.textContent || `Page ${i + 1}`,
          snippet: el.textContent?.slice(0, 100) || "",
        }));
      }
    } catch {
      /* ignore */
    }
    return [{ id: "page-1", title: "Document Main", snippet: "Primary document flow" }];
  }, [htmlDoc]);

  // Extract body content for isolated rendering in canvas
  const bodyContent = useMemo(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlDoc, "text/html");
      const styles = Array.from(doc.querySelectorAll("style"))
        .map((s) => s.textContent)
        .join("\n");
      return {
        styles,
        bodyHtml: doc.body ? doc.body.innerHTML : htmlDoc,
      };
    } catch {
      return { styles: "", bodyHtml: htmlDoc };
    }
  }, [htmlDoc]);

  // Helper to commit visual content change to code
  const commitCanvasChange = useCallback(() => {
    if (!canvasFrameRef.current) return;
    const newBodyHtml = canvasFrameRef.current.innerHTML;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlDoc, "text/html");
      if (doc.body) {
        doc.body.innerHTML = newBodyHtml;
        const serialized = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        setHtmlDoc(serialized);
        setCodeBuffer(serialized);
        setDirty(true);
      }
    } catch {
      /* ignore */
    }
  }, [htmlDoc, setHtmlDoc, setDirty]);

  // Handle element selection inside the visual canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (!target || target === canvasFrameRef.current) {
      setSelectedEl(null);
      setSelectedTarget(null);
      return;
    }

    const computed = window.getComputedStyle(target);
    setSelectedTarget(target);
    setSelectedEl({
      tagName: target.tagName,
      id: target.id,
      className: target.className,
      text: target.textContent || "",
      computed: {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        textAlign: computed.textAlign,
        margin: computed.margin,
        padding: computed.padding,
        width: computed.width,
        height: computed.height,
        borderRadius: computed.borderRadius,
        border: computed.border,
        display: computed.display,
      },
    });
  };

  // Modify styles on the currently selected element
  const updateSelectedStyle = (property: string, value: string) => {
    if (!selectedTarget) return;
    (selectedTarget.style as any)[property] = value;
    commitCanvasChange();

    // Re-read computed style
    const computed = window.getComputedStyle(selectedTarget);
    setSelectedEl((prev) =>
      prev
        ? {
            ...prev,
            computed: {
              ...prev.computed,
              [property]: value,
            },
          }
        : null
    );
  };

  // Quick insertions into the document
  const insertElement = (htmlSnippet: string) => {
    if (!canvasFrameRef.current) return;
    if (selectedTarget && selectedTarget !== canvasFrameRef.current) {
      selectedTarget.insertAdjacentHTML("afterend", htmlSnippet);
    } else {
      canvasFrameRef.current.insertAdjacentHTML("beforeend", htmlSnippet);
    }
    commitCanvasChange();
    addToast("Element inserted");
  };

  // Add a new physical page / slide
  const handleAddPage = () => {
    const pageNumber = pagesList.length + 1;
    let newPageSnippet = "";
    if (htmlMode === "fixed") {
      newPageSnippet = `\n<section class="slide" id="slide-${pageNumber}" style="width:100%;height:100%;padding:40px;box-sizing:border-box;background:#ffffff;">
  <div class="slide-title"><h1>Slide ${pageNumber}</h1></div>
  <div class="slide-content"><p>Add text or visual components here...</p></div>
</section>`;
    } else {
      newPageSnippet = `\n<div class="page-break" style="page-break-before:always;height:24px;border-bottom:1px dashed #cbd5e1;margin:32px 0;"></div>
<section class="page" id="page-${pageNumber}">
  <h2>Chapter ${pageNumber}</h2>
  <p>Continuing content on this new A4 page...</p>
</section>`;
    }
    insertElement(newPageSnippet);
    setActivePageIndex(pagesList.length);
    addToast(`Added Page ${pageNumber}`);
  };

  // Duplicate current page
  const handleDuplicatePage = () => {
    if (!canvasFrameRef.current) return;
    const pages = canvasFrameRef.current.querySelectorAll(".page, .slide, section.page");
    const target = pages[activePageIndex];
    if (target) {
      const clone = target.cloneNode(true) as HTMLElement;
      clone.id = `page-${Date.now()}`;
      target.parentNode?.insertBefore(clone, target.nextSibling);
      commitCanvasChange();
      addToast("Page duplicated");
    }
  };

  // Delete current page
  const handleDeletePage = () => {
    if (!canvasFrameRef.current) return;
    const pages = canvasFrameRef.current.querySelectorAll(".page, .slide, section.page");
    if (pages.length <= 1) {
      addToast("Cannot delete the only page");
      return;
    }
    const target = pages[activePageIndex];
    if (target) {
      target.remove();
      commitCanvasChange();
      setActivePageIndex((prev) => Math.max(0, prev - 1));
      addToast("Page deleted");
    }
  };

  // Export handlers
  const handleExportHtml = () => {
    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("HTML document downloaded");
  };

  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlDoc);
    setIsCopied(true);
    addToast("HTML copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Formatting code editor
  const handleFormatCode = () => {
    try {
      let formatted = "";
      let indent = 0;
      const lines = codeBuffer.split(/>\s*</);
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (i > 0) line = "<" + line;
        if (i < lines.length - 1) line = line + ">";
        if (line.match(/^<\/\w/)) indent = Math.max(0, indent - 1);
        formatted += "  ".repeat(indent) + line + "\n";
        if (line.match(/^<\w[^>]*[^\/]>$/) && !line.startsWith("<!") && !line.startsWith("<?")) {
          indent++;
        }
      }
      setCodeBuffer(formatted.trim());
      setHtmlDoc(formatted.trim());
      addToast("Code formatted");
    } catch {
      /* ignore */
    }
  };

  // Ribbon Tabs Configuration
  const ribbonTabs: RibbonTabDef[] = [
    {
      id: "home",
      label: "Home",
      content: (
        <>
          <RibbonGroup label="Clipboard">
            <RibbonButton icon="📋" label="Paste" size="large" onClick={() => document.execCommand("paste")} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <RibbonButton icon="✂️" label="Cut" size="small" onClick={() => document.execCommand("cut")} />
              <RibbonButton icon="📄" label="Copy" size="small" onClick={() => document.execCommand("copy")} />
            </div>
          </RibbonGroup>

          <RibbonGroup label="Typography">
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <select
                className="fsel"
                style={{ height: "24px", fontSize: "12px", borderRadius: "4px" }}
                onChange={(e) => updateSelectedStyle("fontFamily", e.target.value)}
              >
                <option value='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'>Inter / System</option>
                <option value="Georgia, serif">Georgia</option>
                <option value='"Times New Roman", Times, serif'>Times New Roman</option>
                <option value='"Courier New", monospace'>Courier New</option>
                <option value="Arial, sans-serif">Arial</option>
              </select>

              <select
                className="fsel"
                style={{ height: "24px", width: "54px", fontSize: "12px", borderRadius: "4px" }}
                onChange={(e) => updateSelectedStyle("fontSize", e.target.value)}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="22px">22px</option>
                <option value="28px">28px</option>
                <option value="36px">36px</option>
                <option value="48px">48px</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "2px", alignItems: "center", marginTop: "4px" }}>
              <button
                className="btn"
                style={{ width: "24px", height: "24px", padding: 0, fontWeight: "bold" }}
                onClick={() => updateSelectedStyle("fontWeight", "bold")}
                title="Bold"
              >
                B
              </button>
              <button
                className="btn"
                style={{ width: "24px", height: "24px", padding: 0, fontStyle: "italic" }}
                onClick={() => updateSelectedStyle("fontStyle", "italic")}
                title="Italic"
              >
                I
              </button>
              <button
                className="btn"
                style={{ width: "24px", height: "24px", padding: 0, textDecoration: "underline" }}
                onClick={() => updateSelectedStyle("textDecoration", "underline")}
                title="Underline"
              >
                U
              </button>
              <input
                type="color"
                style={{ width: "22px", height: "22px", padding: 0, border: "none", cursor: "pointer", borderRadius: "3px" }}
                onChange={(e) => updateSelectedStyle("color", e.target.value)}
                title="Font Color"
              />
              <div style={{ width: "1px", height: "16px", background: "var(--color-border-tertiary)", margin: "0 2px" }} />
              <button className="btn" style={{ width: "24px", height: "24px", padding: 0 }} onClick={() => updateSelectedStyle("textAlign", "left")} title="Align Left">
                <AlignLeft size={13} />
              </button>
              <button className="btn" style={{ width: "24px", height: "24px", padding: 0 }} onClick={() => updateSelectedStyle("textAlign", "center")} title="Align Center">
                <AlignCenter size={13} />
              </button>
              <button className="btn" style={{ width: "24px", height: "24px", padding: 0 }} onClick={() => updateSelectedStyle("textAlign", "right")} title="Align Right">
                <AlignRight size={13} />
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup label="Semantic Blocks">
            <div style={{ display: "flex", gap: "4px" }}>
              <RibbonButton icon="H1" label="Heading 1" size="small" onClick={() => insertElement('<h1>Heading 1</h1>\n<p>Content goes here...</p>')} />
              <RibbonButton icon="H2" label="Heading 2" size="small" onClick={() => insertElement('<h2>Heading 2</h2>\n<p>Content goes here...</p>')} />
              <RibbonButton icon="¶" label="Paragraph" size="small" onClick={() => insertElement('<p>New paragraph with standard body typography.</p>')} />
              <RibbonButton icon="❝" label="Callout" size="small" onClick={() => insertElement('<div class="callout" style="background:#f8fafc;border-left:4px solid var(--accent,#0284c7);padding:14px;border-radius:4px;margin:16px 0;"><p style="margin:0;">Key insight or emphasis box</p></div>')} />
            </div>
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "insert",
      label: "Insert",
      content: (
        <>
          <RibbonGroup label="Structure">
            <RibbonButton
              icon="📄"
              label="Page Break"
              size="large"
              onClick={() => insertElement('<div class="page-break" style="page-break-before:always;height:24px;border-bottom:1px dashed #cbd5e1;margin:32px 0;"></div>')}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <RibbonButton icon="🗂️" label="Section" size="small" onClick={() => insertElement('<section style="margin:24px 0;">\n  <h3>Section Title</h3>\n  <p>Section body...</p>\n</section>')} />
              <RibbonButton icon="📦" label="Container" size="small" onClick={() => insertElement('<div style="padding:16px;border:1px solid #e2e8f0;border-radius:6px;margin:16px 0;">\n  <p>Container box</p>\n</div>')} />
            </div>
          </RibbonGroup>

          <RibbonGroup label="Elements">
            <RibbonButton
              icon="📊"
              label="Table"
              size="large"
              onClick={() =>
                insertElement(
                  '<table style="width:100%;border-collapse:collapse;margin:16px 0;">\n  <thead>\n    <tr style="background:#f1f5f9;"><th style="border:1px solid #cbd5e1;padding:8px;">Column 1</th><th style="border:1px solid #cbd5e1;padding:8px;">Column 2</th></tr>\n  </thead>\n  <tbody>\n    <tr><td style="border:1px solid #cbd5e1;padding:8px;">Item 1</td><td style="border:1px solid #cbd5e1;padding:8px;">Value A</td></tr>\n    <tr><td style="border:1px solid #cbd5e1;padding:8px;">Item 2</td><td style="border:1px solid #cbd5e1;padding:8px;">Value B</td></tr>\n  </tbody>\n</table>'
                )
              }
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <RibbonButton
                icon="🖼️"
                label="Image URL"
                size="small"
                onClick={() => {
                  const url = prompt("Enter image URL:");
                  if (url) insertElement(`<img src="${url}" alt="Illustration" style="max-width:100%;border-radius:6px;margin:16px 0;" />`);
                }}
              />
              <RibbonButton icon="➖" label="Divider Line" size="small" onClick={() => insertElement('<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />')} />
            </div>
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "page",
      label: "Page & Layout",
      content: (
        <>
          <RibbonGroup label="Page Preset">
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <select
                className="fsel"
                value={htmlPreset}
                style={{ height: "28px", fontSize: "12px", borderRadius: "4px" }}
                onChange={(e) => {
                  const preset = e.target.value as HtmlPagePreset;
                  setHtmlPreset(preset);
                  if (preset.startsWith("slide")) {
                    setHtmlMode("fixed");
                  } else {
                    setHtmlMode("flow");
                  }
                  addToast(`Preset switched to ${preset}`);
                }}
              >
                <option value="a4-portrait">A4 Portrait (210×297 mm)</option>
                <option value="a4-landscape">A4 Landscape (297×210 mm)</option>
                <option value="slide-16-9">Presentation 16:9</option>
                <option value="slide-4-3">Presentation 4:3</option>
                <option value="custom">Custom Dimensions</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              <button
                className={`btn ${htmlMode === "flow" ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "2px 8px" }}
                onClick={() => setHtmlMode("flow")}
              >
                Document Flow
              </button>
              <button
                className={`btn ${htmlMode === "fixed" ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "2px 8px" }}
                onClick={() => setHtmlMode("fixed")}
              >
                Fixed Canvas
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup label="Canvas Tools">
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className={`btn ${showRulers ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => setShowRulers(!showRulers)}
              >
                <Ruler size={13} /> Rulers
              </button>
              <button
                className={`btn ${showGrid ? "active" : ""}`}
                style={{ fontSize: "11px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid size={13} /> Grid
              </button>
            </div>
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "view",
      label: "View & Mode",
      content: (
        <>
          <RibbonGroup label="Editing Mode">
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                className={`btn ${htmlEditMode === "design" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => setHtmlEditMode("design")}
              >
                <Eye size={14} /> Design
              </button>
              <button
                className={`btn ${htmlEditMode === "code" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => setHtmlEditMode("code")}
              >
                <FileCode size={14} /> Code
              </button>
              <button
                className={`btn ${htmlEditMode === "split" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }}
                onClick={() => setHtmlEditMode("split")}
              >
                <Columns size={14} /> Split
              </button>
            </div>
          </RibbonGroup>

          <RibbonGroup label="Zoom">
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button className="btn" style={{ padding: "4px 8px" }} onClick={() => setHtmlZoom(Math.max(0.4, htmlZoom - 0.15))}>
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: "12px", minWidth: "42px", textAlign: "center", fontWeight: 600 }}>
                {Math.round(htmlZoom * 100)}%
              </span>
              <button className="btn" style={{ padding: "4px 8px" }} onClick={() => setHtmlZoom(Math.min(2.0, htmlZoom + 0.15))}>
                <ZoomIn size={13} />
              </button>
              <button className="btn" style={{ fontSize: "11px", padding: "4px 8px" }} onClick={() => setHtmlZoom(1.0)}>
                100%
              </button>
            </div>
          </RibbonGroup>
        </>
      ),
    },
    {
      id: "export",
      label: "Export",
      content: (
        <>
          <RibbonGroup label="Document Output">
            <RibbonButton icon="📥" label="Download HTML" size="large" onClick={handleExportHtml} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <RibbonButton icon="🖨️" label="Print / Save PDF" size="small" onClick={handlePrintPdf} />
              <RibbonButton icon="📋" label="Copy HTML Code" size="small" onClick={handleCopyCode} />
            </div>
          </RibbonGroup>
        </>
      ),
    },
  ];

  return (
    <div className="html-studio-root" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* Ribbon Header */}
      <Ribbon
        tabs={ribbonTabs}
        activeTab={activeTab || "home"}
        onTabChange={setActiveTab}
        rightControls={
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "12px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "12px",
                background: "var(--color-button-bg)",
                border: "1px solid var(--color-button-border)",
                color: "var(--app-html, #0284c7)",
              }}
            >
              {presetDimensions.label}
            </span>
            <button
              className="btn"
              onClick={onSave}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "4px 10px" }}
              title="Save HTML Document"
            >
              Save
            </button>
          </div>
        }
      />

      {/* Main Workspace */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Left: Pages / Thumbnails Panel */}
        <div
          className="html-studio-pages"
          style={{
            width: "210px",
            borderRight: "1px solid var(--color-border-tertiary)",
            background: "var(--color-background-secondary)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "12px 8px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: "8px", padding: "0 4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.05em" }}>
              {htmlMode === "fixed" ? "Slides" : "Pages"} ({pagesList.length})
            </span>
            <button
              className="btn"
              onClick={handleAddPage}
              style={{ padding: "2px 6px", fontSize: "11px", display: "flex", alignItems: "center", gap: "2px" }}
              title="Add New Page"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {/* Page Thumbnails List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pagesList.map((pg, index) => {
              const isSelected = activePageIndex === index;
              return (
                <div
                  key={pg.id}
                  onClick={() => setActivePageIndex(index)}
                  style={{
                    border: isSelected ? "2px solid var(--accent, #0284c7)" : "1px solid var(--color-border-tertiary)",
                    borderRadius: "6px",
                    background: "var(--color-background-primary)",
                    padding: "8px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: isSelected ? "var(--accent, #0284c7)" : "var(--color-text-primary)" }}>
                      {index + 1}. {pg.title}
                    </span>
                  </div>

                  {/* Thumbnail Aspect Ratio Preview */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: `${presetDimensions.aspect}`,
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                      padding: "6px",
                      fontSize: "7px",
                      color: "#94a3b8",
                      lineHeight: "1.3",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#475569", marginBottom: "2px" }}>{pg.title}</div>
                    <div>{pg.snippet}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "12px", display: "flex", gap: "4px" }}>
            <button className="btn" onClick={handleDuplicatePage} style={{ flex: 1, padding: "4px", fontSize: "11px" }} title="Duplicate Page">
              <Copy size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Duplicate
            </button>
            <button className="btn" onClick={handleDeletePage} style={{ flex: 1, padding: "4px", fontSize: "11px", color: "#dc2626" }} title="Delete Page">
              <Trash2 size={12} style={{ display: "inline", verticalAlign: "middle" }} /> Delete
            </button>
          </div>
        </div>

        {/* Center: Workspace Canvas & Code Editor */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: "flex",
            position: "relative",
            overflow: "hidden",
            background: showGrid
              ? "radial-gradient(circle, var(--color-border-tertiary) 1px, transparent 1px)"
              : "var(--color-background-tertiary)",
            backgroundSize: showGrid ? "16px 16px" : undefined,
          }}
        >
          {/* Split Mode or Code Mode Editor */}
          {(htmlEditMode === "code" || htmlEditMode === "split") && (
            <div
              style={{
                width: htmlEditMode === "code" ? "100%" : "45%",
                height: "100%",
                borderRight: htmlEditMode === "split" ? "1px solid var(--color-border-tertiary)" : "none",
                display: "flex",
                flexDirection: "column",
                background: "var(--color-background-secondary)",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: "32px",
                  borderBottom: "1px solid var(--color-border-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 12px",
                  background: "var(--color-background-primary)",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                <span>HTML / CSS SOURCE</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button className="btn" onClick={handleFormatCode} style={{ padding: "2px 8px", fontSize: "11px" }}>
                    Format
                  </button>
                  <button className="btn" onClick={handleCopyCode} style={{ padding: "2px 8px", fontSize: "11px" }}>
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <textarea
                value={codeBuffer}
                onChange={(e) => {
                  setCodeBuffer(e.target.value);
                  setHtmlDoc(e.target.value);
                  setDirty(true);
                }}
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: "16px",
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: "12px",
                  lineHeight: "1.6",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  whiteSpace: "pre",
                }}
              />
            </div>
          )}

          {/* Design Visual Page Canvas */}
          {(htmlEditMode === "design" || htmlEditMode === "split") && (
            <div
              style={{
                flex: 1,
                height: "100%",
                overflow: "auto",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Optional Rulers */}
              {showRulers && (
                <div
                  style={{
                    height: "18px",
                    background: "var(--color-background-secondary)",
                    borderBottom: "1px solid var(--color-border-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "40px",
                    fontSize: "9px",
                    color: "var(--color-text-tertiary)",
                    userSelect: "none",
                  }}
                >
                  <span style={{ marginRight: "38px" }}>0mm</span>
                  <span style={{ marginRight: "38px" }}>50mm</span>
                  <span style={{ marginRight: "38px" }}>100mm</span>
                  <span style={{ marginRight: "38px" }}>150mm</span>
                  <span style={{ marginRight: "38px" }}>200mm</span>
                </div>
              )}

              {/* Scrollable Center Canvas */}
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: "32px 16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
              >
                {/* Physical Page Canvas Container */}
                <div
                  style={{
                    transform: `scale(${htmlZoom})`,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease",
                  }}
                >
                  {/* Dynamic CSS from Document */}
                  {bodyContent.styles && <style>{bodyContent.styles}</style>}

                  <div
                    ref={canvasFrameRef}
                    onClick={handleCanvasClick}
                    onInput={commitCanvasChange}
                    contentEditable={htmlEditMode === "design"}
                    suppressContentEditableWarning
                    style={{
                      width: presetDimensions.width,
                      minHeight: presetDimensions.minHeight,
                      background: "#ffffff",
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                      borderRadius: "2px",
                      outline: "none",
                      boxSizing: "border-box",
                      position: "relative",
                    }}
                    dangerouslySetInnerHTML={{ __html: bodyContent.bodyHtml }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Properties Panel */}
        <div
          className="html-studio-props"
          style={{
            width: "250px",
            borderLeft: "1px solid var(--color-border-tertiary)",
            background: "var(--color-background-secondary)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "14px",
            flexShrink: 0,
            fontSize: "12px",
          }}
        >
          {selectedEl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
                  Selected Element
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: "13px",
                      color: "var(--accent, #0284c7)",
                    }}
                  >
                    &lt;{selectedEl.tagName.toLowerCase()}&gt;
                  </span>
                  {selectedEl.className && (
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      .{selectedEl.className.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>

              {/* Typography Properties */}
              <div>
                <span style={{ fontWeight: 600, fontSize: "11px", display: "block", marginBottom: "6px" }}>Typography</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Font Size</span>
                    <input
                      type="text"
                      className="fnum"
                      defaultValue={selectedEl.computed.fontSize}
                      onBlur={(e) => updateSelectedStyle("fontSize", e.target.value)}
                      style={{ width: "65px", height: "22px", fontSize: "11px", padding: "0 4px" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Color</span>
                    <input
                      type="color"
                      onChange={(e) => updateSelectedStyle("color", e.target.value)}
                      style={{ width: "32px", height: "22px", border: "none", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* Spacing & Geometry */}
              <div style={{ borderTop: "1px solid var(--color-border-tertiary)", paddingTop: "10px" }}>
                <span style={{ fontWeight: 600, fontSize: "11px", display: "block", marginBottom: "6px" }}>Spacing & Layout</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Margin</span>
                    <input
                      type="text"
                      className="fnum"
                      defaultValue={selectedEl.computed.margin}
                      onBlur={(e) => updateSelectedStyle("margin", e.target.value)}
                      style={{ width: "80px", height: "22px", fontSize: "11px", padding: "0 4px" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Padding</span>
                    <input
                      type="text"
                      className="fnum"
                      defaultValue={selectedEl.computed.padding}
                      onBlur={(e) => updateSelectedStyle("padding", e.target.value)}
                      style={{ width: "80px", height: "22px", fontSize: "11px", padding: "0 4px" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Background</span>
                    <input
                      type="color"
                      onChange={(e) => updateSelectedStyle("backgroundColor", e.target.value)}
                      style={{ width: "32px", height: "22px", border: "none", cursor: "pointer" }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Border Radius</span>
                    <input
                      type="text"
                      className="fnum"
                      defaultValue={selectedEl.computed.borderRadius}
                      onBlur={(e) => updateSelectedStyle("borderRadius", e.target.value)}
                      style={{ width: "65px", height: "22px", fontSize: "11px", padding: "0 4px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ borderTop: "1px solid var(--color-border-tertiary)", paddingTop: "10px", display: "flex", gap: "4px" }}>
                <button
                  className="btn"
                  onClick={() => {
                    if (selectedTarget) {
                      selectedTarget.remove();
                      commitCanvasChange();
                      setSelectedEl(null);
                      setSelectedTarget(null);
                      addToast("Element deleted");
                    }
                  }}
                  style={{ color: "#dc2626", flex: 1, padding: "4px", fontSize: "11px" }}
                >
                  Delete Element
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ borderBottom: "1px solid var(--color-border-tertiary)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
                  Document Specifications
                </span>
                <div style={{ fontWeight: 600, fontSize: "12px", marginTop: "2px" }}>{presetDimensions.label}</div>
              </div>

              <div>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", display: "block", marginBottom: "4px" }}>
                  Layout Mode:
                </span>
                <div style={{ fontWeight: 600 }}>{htmlMode === "flow" ? "Continuous Flow" : "Fixed Canvas (Slide)"}</div>
              </div>

              <div>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", display: "block", marginBottom: "4px" }}>
                  Physical Margins:
                </span>
                <div style={{ fontWeight: 600 }}>20mm (Standard Printable)</div>
              </div>

              <div style={{ padding: "10px", background: "var(--color-background-primary)", borderRadius: "6px", border: "1px solid var(--color-border-tertiary)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", lineHeight: "1.4" }}>
                  💡 Click any element on the page canvas to inspect and edit its visual typography, box model spacing, and CSS properties directly.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
