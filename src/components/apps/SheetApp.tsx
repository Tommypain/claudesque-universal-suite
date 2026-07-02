import { useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { useDocumentStore } from "../../store/useDocumentStore";
import { useAppStore } from "../../store/useAppStore";

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

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0,
    cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function SheetApp() {
  const sheet = useDocumentStore((s) => s.sheet);
  const setSheetCell = useDocumentStore((s) => s.setSheetCell);
  const [active, setActive] = useState("A1");
  const [editingRaw, setEditingRaw] = useState<string | null>(null);

  const activeCol = active.match(/[A-Z]+/)?.[0] ?? "A";
  const activeRow = active.match(/\d+/)?.[0] ?? "1";

  const commit = (id: string, el: HTMLTableCellElement) => {
    setSheetCell(id, el.textContent ?? "");
    setEditingRaw(null);
  };

  const move = (id: string, dr: number, dc: number) => {
    const c = colIndex(id.match(/[A-Z]+/)![0]);
    const r = +id.match(/\d+/)![0];
    const nc = Math.min(COLS - 1, Math.max(0, c + dc));
    const nr = Math.min(ROWS, Math.max(1, r + dr));
    setActive(`${colName(nc)}${nr}`);
  };

  const homeTab = (
    <>
      <RibbonGroup label="Number">
        <RibbonButton
          icon="$"
          label="Currency"
          onClick={() =>
            setSheetCell(
              active,
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(sheet[active]) || 0),
            )
          }
        />
        <RibbonButton
          icon="%"
          label="Percent"
          onClick={() =>
            setSheetCell(
              active,
              (Number(sheet[active]) / 100).toLocaleString("en-US", {
                style: "percent",
              }),
            )
          }
        />
        <RibbonButton
          icon="📅"
          label="Date"
          onClick={() =>
            setSheetCell(
              active,
              new Date(Number(sheet[active]) || Date.now()).toLocaleDateString(),
            )
          }
        />
      </RibbonGroup>
      <RibbonGroup label="Format">
        <RibbonButton icon="↩" label="Wrap" onClick={() => {}} />
      </RibbonGroup>
    </>
  );

  const insert = (fn: string) => {
    setSheetCell(active, fn);
    setActive(active);
  };
  const formulasTab = (
    <RibbonGroup label="Functions">
      {["=SUM(A1:A5)", "=AVERAGE(A1:A5)", "=MAX(A1:A5)", "=MIN(A1:A5)", "=COUNT(A1:A5)", "=LEN(A1)"].map(
        (f) => (
          <RibbonButton key={f} icon="fx" label={f.slice(1, 4)} onClick={() => insert(f)} title={f} />
        ),
      )}
    </RibbonGroup>
  );

  const sortRows = (dir: 1 | -1) => {
    const col = activeCol;
    const rows = Array.from({ length: ROWS }, (_, i) => i + 1);
    rows.sort((a, b) => {
      const va = sheet[`${col}${a}`] ?? "";
      const vb = sheet[`${col}${b}`] ?? "";
      const na = parseFloat(va),
        nb = parseFloat(vb);
      const cmp =
        !isNaN(na) && !isNaN(nb) ? na - nb : va.localeCompare(vb);
      return cmp * dir;
    });
    const next: Record<string, string> = {};
    rows.forEach((oldR, i) => {
      for (let c = 0; c < COLS; c++) {
        const v = sheet[`${colName(c)}${oldR}`];
        if (v != null) next[`${colName(c)}${i + 1}`] = v;
      }
    });
    useDocumentStore.getState().setSheet(next);
    useAppStore.getState().addToast(`Sorted ${dir === 1 ? "A→Z" : "Z→A"}`);
  };

  const dataTab = (
    <RibbonGroup label="Sort & Filter">
      <RibbonButton icon="↓" label="A→Z" onClick={() => sortRows(1)} />
      <RibbonButton icon="↑" label="Z→A" onClick={() => sortRows(-1)} />
    </RibbonGroup>
  );

  return (
    <>
      <Ribbon
        tabs={[
          { id: "home", label: "Home", content: homeTab },
          { id: "formulas", label: "Formulas", content: formulasTab },
          { id: "data", label: "Data", content: dataTab },
        ]}
      />
      <div className="oct-workspace" style={{ padding: 0, alignItems: "stretch" }}>
        <div className="oct-sheet-wrap">
          <table className="oct-sheet-table">
            <thead>
              <tr>
                <th className="corner" />
                {Array.from({ length: COLS }, (_, c) => (
                  <th key={c} className={colName(c) === activeCol ? "hl" : ""}>
                    {colName(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, r) => (
                <tr key={r}>
                  <td className={`rowhead${String(r + 1) === activeRow ? " hl" : ""}`}>
                    {r + 1}
                  </td>
                  {Array.from({ length: COLS }, (_, c) => {
                    const id = `${colName(c)}${r + 1}`;
                    const raw = sheet[id] ?? "";
                    const isActive = id === active;
                    const display =
                      isActive && editingRaw !== null
                        ? editingRaw
                        : evaluate(raw, sheet);
                    return (
                      <td
                        key={id}
                        className={`oct-cell${isActive ? " active" : ""}`}
                        contentEditable
                        suppressContentEditableWarning
                        onFocus={() => {
                          setActive(id);
                          setEditingRaw(raw);
                        }}
                        onBlur={(e) => commit(id, e.currentTarget)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commit(id, e.currentTarget);
                            move(id, 1, 0);
                          } else if (e.key === "Tab") {
                            e.preventDefault();
                            commit(id, e.currentTarget);
                            move(id, 0, 1);
                          } else if (e.key === "ArrowUp" && editingRaw === "") {
                            move(id, -1, 0);
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: display }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
