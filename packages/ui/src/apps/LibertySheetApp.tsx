import { useState, useEffect } from "react";
import { Ribbon, RibbonGroup, RibbonButton } from "@liberty/ui";
import { useDocumentStore } from "@liberty/shared-hooks";
import { ArrowRight, RefreshCw } from "lucide-react";

const COLS = 26;
const ROWS = 100;
const colName = (i: number) => String.fromCharCode(65 + i);

function colIndex(name: string) {
  return name.split("").reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0) - 1;
}

function expandRange(range: string): string[] {
  const [a, b] = range.split(":");
  const ma = a.match(/([A-Z]+)(\d+)/);
  const mb = b.match(/([A-Z]+)(\d+)/);
  if (!ma || !mb) return [];
  const c1 = colIndex(ma[1]),
    r1 = +ma[2],
    c2 = colIndex(mb[1]),
    r2 = +mb[2];
  const cells: string[] = [];
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++)
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
      cells.push(`${colName(c)}${r}`);
  return cells;
}

function splitArgs(s: string) {
  const parts: string[] = [];
  let depth = 0,
    cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (c === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += c;
  }
  parts.push(cur);
  return parts;
}

export function evaluate(
  raw: string,
  data: Record<string, string>,
  seen = new Set<string>(),
): string {
  if (!raw || raw[0] !== "=") return raw ?? "";
  let expr = raw.slice(1);
  const get = (ref: string) => {
    if (seen.has(ref)) return 0;
    const v = data[ref] ?? "";
    return v[0] === "="
      ? parseFloat(evaluate(v, data, new Set([...seen, ref]))) || 0
      : parseFloat(v) || 0;
  };
  const vals = (range: string) => expandRange(range).map(get);

  try {
    expr = expr.replace(
      /(SUM|AVERAGE|MAX|MIN|COUNT)\(([^)]+)\)/gi,
      (_, fn, arg) => {
        const nums = arg.includes(":")
          ? vals(arg.trim())
          : arg.split(",").map((s: string) => get(s.trim()));
        const f = fn.toUpperCase();
        if (f === "SUM") return String(nums.reduce((a: number, b: number) => a + b, 0));
        if (f === "AVERAGE")
          return String(nums.reduce((a: number, b: number) => a + b, 0) / nums.length);
        if (f === "MAX") return String(Math.max(...nums));
        if (f === "MIN") return String(Math.min(...nums));
        if (f === "COUNT") return String(nums.filter((n: number) => !isNaN(n)).length);
        return "0";
      },
    );
    expr = expr.replace(/LEN\(([A-Z]+\d+)\)/gi, (_, ref) =>
      String((data[ref.toUpperCase()] ?? "").length),
    );
    expr = expr.replace(/CONCATENATE\(([^)]+)\)/gi, (_, args) =>
      JSON.stringify(
        args
          .split(",")
          .map((s: string) => {
            const t = s.trim();
            const m = t.match(/^[A-Z]+\d+$/);
            return m ? (data[t] ?? "") : t.replace(/^["']|["']$/g, "");
          })
          .join(""),
      ),
    );
    const ifMatch = expr.match(/^IF\((.+)\)$/i);
    if (ifMatch) {
      const parts = splitArgs(ifMatch[1]);
      if (parts.length === 3) {
        const cond = parts[0].replace(/([A-Z]+\d+)/g, (r) => String(get(r)));
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict";return (${cond})`)();
        const chosen = res ? parts[1] : parts[2];
        return chosen.trim().replace(/^["']|["']$/g, "");
      }
    }
    // replace remaining cell refs
    expr = expr.replace(/[A-Z]+\d+/g, (r) => String(get(r)));
    if (/^[\d\s+\-*/.()]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      return String(Function(`"use strict";return (${expr})`)());
    }
    return expr.replace(/^"|"$/g, "");
  } catch {
    return "#ERR";
  }
}

interface LibertySheetAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * LibertySheetApp — The React spreadsheet component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite Spreadsheet (Sheets).
 */
export function LibertySheetApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertySheetAppProps) {
  const sheet = useDocumentStore((s) => s.sheet);
  const setSheetCell = useDocumentStore((s) => s.setSheetCell);
  const [activeCell, setActiveCell] = useState("A1");
  const [editingText, setEditingText] = useState("");
  const [dirtyEvaluations, setDirtyEvaluations] = useState(0);

  // Sync formula bar input with active cell changes
  useEffect(() => {
    setEditingText(sheet[activeCell] ?? "");
  }, [activeCell, sheet]);

  const handleCellSelect = (col: number, row: number) => {
    const addr = `${colName(col)}${row}`;
    setActiveCell(addr);
  };

  const handleFormulaChange = (val: string) => {
    setEditingText(val);
    setSheetCell(activeCell, val);
  };

  const handleCellBlur = (addr: string, val: string) => {
    setSheetCell(addr, val);
    setDirtyEvaluations((d) => d + 1); // trigger re-render of evaluated cells
  };

  const handleEvaluate = () => {
    setDirtyEvaluations((d) => d + 1);
  };

  const insertTab = (
    <>
      <RibbonGroup label="Insert">
        <RibbonButton icon="📈" label="Chart" onClick={() => alert("Chart feature coming soon in C++ Native Core")} size="large" />
        <RibbonButton icon="📸" label="Screenshot" onClick={() => alert("Capture screen")} size="large" />
      </RibbonGroup>
    </>
  );

  const formulasTab = (
    <>
      <RibbonGroup label="Function Library">
        <RibbonButton icon="∑" label="AutoSum" onClick={() => handleFormulaChange("=SUM(")} size="large" />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <RibbonButton icon="ƒ" label="Insert Function" size="small" onClick={() => alert("Insert Formula helper")} />
          <RibbonButton icon="📅" label="Date/Time" size="small" onClick={() => handleFormulaChange("=TODAY()")} />
        </div>
      </RibbonGroup>
      <RibbonGroup label="Calculation">
        <RibbonButton icon={<RefreshCw size={16} />} label="Calculate Now" onClick={handleEvaluate} size="large" />
      </RibbonGroup>
    </>
  );

  return (
    <>
      <Ribbon
        tabs={[
          { id: "sheet-home", label: "Home", content: (
            <RibbonGroup label="Clipboard">
              <RibbonButton icon="📋" label="Paste" size="large" onClick={() => {}} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <RibbonButton icon="✂️" label="Cut" size="small" />
                <RibbonButton icon="📄" label="Copy" size="small" />
              </div>
            </RibbonGroup>
          ) },
          { id: "sheet-insert", label: "Insert", content: insertTab },
          { id: "sheet-formulas", label: "Formulas", content: formulasTab },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="workspace-view active" id="view-sheet">
        <div className="sheet-canvas">
          <div className="formula-bar" style={{ display: "flex", alignItems: "center" }}>
            <span className="font-semibold text-gray-500 text-xs">Formula:</span>
            <div className="cell-address" id="active-cell-address">{activeCell}</div>
            <ArrowRight size={14} style={{ opacity: 0.5, margin: "0 4px" }} />
            <input
              type="text"
              className="formula-input text-[var(--color-text-primary)] bg-[var(--color-background-primary)]"
              style={{ flex: 1, height: "24px", fontSize: "12px", border: "1px solid var(--color-border-secondary)", borderRadius: "4px", padding: "0 6px" }}
              value={editingText}
              onChange={(e) => handleFormulaChange(e.target.value)}
              placeholder="Type cell value or formula (e.g., =SUM(A1:A2))"
            />
            <button className="qb ml-2" title="Evaluate Sheet" onClick={handleEvaluate}>
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="sheet-table-wrapper" id="sheet-wrapper" style={{ overflow: "auto", flex: 1 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "40px", border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: "11px", height: "24px" }}></th>
                  {Array.from({ length: COLS }).map((_, c) => (
                    <th key={c} style={{ border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: "11px", fontWeight: "bold", textAlign: "center" }}>
                      {colName(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }).map((_, r) => {
                  const rowNum = r + 1;
                  return (
                    <tr key={rowNum}>
                      <td style={{ border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: "11px", fontWeight: "bold", textAlign: "center", height: "22px" }}>
                        {rowNum}
                      </td>
                      {Array.from({ length: COLS }).map((_, c) => {
                        const addr = `${colName(c)}${rowNum}`;
                        const isSelected = activeCell === addr;
                        const rawVal = sheet[addr] ?? "";
                        const displayVal = rawVal[0] === "=" ? evaluate(rawVal, sheet) : rawVal;

                        return (
                          <td
                            key={addr}
                            style={{
                              border: "1px solid var(--color-border-secondary)",
                              background: isSelected ? "rgba(37,99,235,0.08)" : "transparent",
                              position: "relative",
                              padding: 0,
                            }}
                          >
                            <input
                              type="text"
                              style={{
                                width: "100%",
                                height: "100%",
                                border: isSelected ? "1.5px solid var(--color-accent, #2563eb)" : "none",
                                background: "transparent",
                                fontSize: "12px",
                                outline: "none",
                                padding: "2px 4px",
                                color: "var(--color-text-primary)",
                              }}
                              value={isSelected ? rawVal : displayVal}
                              onChange={(e) => setSheetCell(addr, e.target.value)}
                              onFocus={() => setActiveCell(addr)}
                              onBlur={(e) => handleCellBlur(addr, e.target.value)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sheet-tabs-bar" id="sheet-tabs-container">
            <div className="sheet-tab active" style={{ display: "inline-block", padding: "4px 12px", fontSize: "11px", border: "1.5px solid var(--color-accent, #2563eb)", borderRadius: "4px", background: "var(--color-background-primary)" }}>
              Sheet1
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
