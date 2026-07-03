import { useEffect, useRef, useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { useDocumentStore } from "../../store/useDocumentStore";

const exec = (cmd: string, val?: string) =>
  document.execCommand(cmd, false, val);

interface LibertyWriteAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * LibertyWriteApp — The React word processor component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite Word Processor.
 */
export function LibertyWriteApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyWriteAppProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const writeHtml = useDocumentStore((s) => s.writeHtml);
  const setWriteHtml = useDocumentStore((s) => s.setWriteHtml);
  const [margins, setMargins] = useState("96px 90px");
  const [pageW, setPageW] = useState(794);
  const [showTable, setShowTable] = useState(false);

  // Load HTML into editor when it changes externally (file open).
  useEffect(() => {
    const el = editorRef.current;
    if (el && el.innerHTML !== writeHtml) el.innerHTML = writeHtml;
  }, [writeHtml]);

  const sync = () => {
    if (editorRef.current) {
      setWriteHtml(editorRef.current.innerHTML);
    }
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        exec("insertImage", reader.result as string);
        sync();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const insertTable = (r: number, c: number) => {
    let html = '<table border="1" style="border-collapse:collapse;width:100%">';
    for (let i = 0; i < r; i++) {
      html += "<tr>";
      for (let j = 0; j < c; j++) html += "<td style='padding:6px'>&nbsp;</td>";
      html += "</tr>";
    }
    html += "</table><p></p>";
    exec("insertHTML", html);
    setShowTable(false);
    sync();
  };

  const homeTab = (
    <>
      <RibbonGroup label="Clipboard">
        <RibbonButton icon="📋" label="Paste" size="large" onClick={() => exec("paste")} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <RibbonButton icon="✂️" label="Cut" size="small" onClick={() => exec("cut")} />
          <RibbonButton icon="📄" label="Copy" size="small" onClick={() => exec("copy")} />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Font">
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <select
            className="fsel"
            style={{ height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
            onChange={(e) => {
              exec("fontName", e.target.value);
              sync();
            }}
          >
            <option>Calibri</option>
            <option>Arial</option>
            <option>Georgia</option>
            <option>Times New Roman</option>
            <option>Courier New</option>
          </select>
          <select
            className="fnum"
            style={{ height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
            defaultValue="3"
            onChange={(e) => {
              exec("fontSize", e.target.value);
              sync();
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {[8, 10, 12, 14, 18, 24, 36][n - 1]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <RibbonButton icon={<b>B</b>} onClick={() => (exec("bold"), sync())} title="Bold" size="small" />
          <RibbonButton icon={<i>I</i>} onClick={() => (exec("italic"), sync())} title="Italic" size="small" />
          <RibbonButton icon={<u>U</u>} onClick={() => (exec("underline"), sync())} title="Underline" size="small" />
          <RibbonButton icon={<s>S</s>} onClick={() => (exec("strikeThrough"), sync())} title="Strikethrough" size="small" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Paragraph">
        <div style={{ display: "flex", gap: "2px" }}>
          <RibbonButton icon="Align Left" onClick={() => (exec("justifyLeft"), sync())} title="Align left" size="small" />
          <RibbonButton icon="Center" onClick={() => (exec("justifyCenter"), sync())} title="Center" size="small" />
          <RibbonButton icon="Align Right" onClick={() => (exec("justifyRight"), sync())} title="Align right" size="small" />
          <RibbonButton icon="Justify" onClick={() => (exec("justifyFull"), sync())} title="Justify" size="small" />
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          <RibbonButton icon="• List" onClick={() => (exec("insertUnorderedList"), sync())} title="Bullet list" size="small" />
          <RibbonButton icon="1. List" onClick={() => (exec("insertOrderedList"), sync())} title="Numbered list" size="small" />
          <RibbonButton icon="→" onClick={() => (exec("indent"), sync())} title="Indent" size="small" />
          <RibbonButton icon="←" onClick={() => (exec("outdent"), sync())} title="Outdent" size="small" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Preset Styles">
        <select
          className="fsel"
          style={{ height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
          defaultValue="p"
          onChange={(e) => {
            exec("formatBlock", e.target.value);
            sync();
          }}
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
      </RibbonGroup>
    </>
  );

  const insertTab = (
    <>
      <RibbonGroup label="Media">
        <RibbonButton icon="🖼️" label="Image" onClick={insertImage} size="large" />
      </RibbonGroup>
      <RibbonGroup label="Tables">
        <div style={{ position: "relative" }}>
          <RibbonButton icon="📅" label="Table" onClick={() => setShowTable((v) => !v)} size="large" />
          {showTable && (
            <div className="oct-popover" style={{ top: "100%", left: 0, position: "absolute", zIndex: 100, background: "var(--color-background-primary)", border: "1px solid var(--color-border-secondary)", padding: 8, borderRadius: 6 }}>
              <TablePicker onPick={insertTable} />
            </div>
          )}
        </div>
      </RibbonGroup>
      <RibbonGroup label="Links">
        <RibbonButton
          icon="🔗"
          label="Link"
          size="large"
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) (exec("createLink", url), sync());
          }}
        />
        <RibbonButton
          icon="⤵️"
          label="Page Break"
          size="large"
          onClick={() => {
            exec("insertHTML", '<hr style="page-break-after:always">');
            sync();
          }}
        />
      </RibbonGroup>
    </>
  );

  const layoutTab = (
    <>
      <RibbonGroup label="Margins">
        <select
          className="fsel"
          style={{ height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
          onChange={(e) => setMargins(e.target.value)}
          value={margins}
        >
          <option value="96px 90px">Normal</option>
          <option value="48px 48px">Narrow</option>
          <option value="96px 140px">Wide</option>
        </select>
      </RibbonGroup>
      <RibbonGroup label="Page">
        <select
          className="fsel"
          style={{ height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px" }}
          onChange={(e) => setPageW(Number(e.target.value))}
          value={pageW}
        >
          <option value={794}>A4</option>
          <option value={816}>Letter</option>
        </select>
      </RibbonGroup>
    </>
  );

  return (
    <>
      <Ribbon
        tabs={[
          { id: "home", label: "Home", content: homeTab },
          { id: "insert", label: "Insert", content: insertTab },
          { id: "layout", label: "Layout", content: layoutTab },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="workspace-view active" id="view-word">
        <div className="word-workspace-container">
          <div className="word-nav-sidebar" id="word-pages-nav">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pages Outline</div>
            <div className="slide-thumbnail active" style={{ width: "100%", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-accent)", borderRadius: 4, background: "var(--color-background-primary)", color: "var(--color-text-secondary)", fontSize: "11px" }}>
              Page 1
            </div>
          </div>
          <div className="word-pages-stream" id="word-pages-container">
            <div
              ref={editorRef}
              className="doc-page"
              contentEditable
              suppressContentEditableWarning
              style={{ padding: margins, width: pageW, minHeight: "1000px" }}
              onInput={sync}
              onBlur={sync}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function TablePicker({ onPick }: { onPick: (r: number, c: number) => void }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const cells = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 8; c++) {
      const on = r <= hover.r && c <= hover.c;
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`oct-grid-cell${on ? " on" : ""}`}
          style={{
            width: "16px",
            height: "16px",
            border: "1px solid #ddd",
            background: on ? "var(--color-accent, #2563eb)" : "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={() => setHover({ r, c })}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(r + 1, c + 1);
          }}
        />
      );
    }
  return (
    <>
      <div className="oct-grid-picker" style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "2px" }}>
        {cells}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, paddingTop: 4 }}>
        {hover.r + 1} × {hover.c + 1}
      </div>
    </>
  );
}
