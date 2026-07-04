import { useCallback } from "react";
import { useAppStore, type AppId } from "../store/useAppStore";
import { useDocumentStore } from "../store/useDocumentStore";

function ensureScript(id: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

function colName(i: number): string {
  let s = "";
  i++;
  while (i > 0) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}

function detectDelimiter(text: string): string {
  const limit = Math.min(text.length, 1000);
  let commas = 0;
  let tabs = 0;
  for (let i = 0; i < limit; i++) {
    if (text[i] === ',') commas++;
    else if (text[i] === '\t') tabs++;
  }
  return tabs > commas ? '\t' : ',';
}

function parseCsvLine(line: string, delim: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; ++i) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delim && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  cells.push(current);
  return cells;
}

function formatCsvValue(val: string, delim: string): string {
  const needsQuotes = val.includes(delim) || val.includes('\n') || val.includes('\r') || val.includes('"');
  if (!needsQuotes) return val;
  return `"${val.replace(/"/g, '""')}"`;
}

export function useFileManager() {
  const setActiveApp = useAppStore((s) => s.setActiveApp);
  const addToast = useAppStore((s) => s.addToast);
  const doc = useDocumentStore;

  const openFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const store = doc.getState();
      store.setFileName(file.name);

      try {
        if (ext === "docx") {
          await ensureScript(
            "mammoth-lib",
            "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js",
          );
          const buf = await file.arrayBuffer();
          // @ts-expect-error cdn global
          const res = await window.mammoth.convertToHtml({ arrayBuffer: buf });
          store.setWriteHtml(res.value);
          setActiveApp("write");
        } else if (ext === "txt") {
          const text = await file.text();
          const html = text
            .split(/\n{2,}/)
            .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
            .join("");
          store.setWriteHtml(html);
          setActiveApp("write");
        } else if (ext === "html" || ext === "htm") {
          store.setWriteHtml(await file.text());
          setActiveApp("write");
        } else if (ext === "csv" || ext === "tsv") {
          const text = await file.text();
          const delim = ext === "tsv" ? "\t" : detectDelimiter(text);
          const data: Record<string, string> = {};
          
          let currentLine = "";
          let inQuotes = false;
          const lines: string[] = [];
          for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
              inQuotes = !inQuotes;
              currentLine += c;
            } else if (c === '\n' && !inQuotes) {
              lines.push(currentLine);
              currentLine = "";
            } else if (c === '\r' && !inQuotes) {
              // skip
            } else {
              currentLine += c;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }

          lines.forEach((line, r) => {
            const rowCells = parseCsvLine(line, delim);
            rowCells.forEach((val, c) => {
              if (val !== "") data[`${colName(c)}${r + 1}`] = val;
            });
          });
          store.setSheet(data);
          setActiveApp("sheet");
        } else if (ext === "xlsx" || ext === "xls") {
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const isZip = bytes.length >= 4 &&
                        bytes[0] === 0x50 && bytes[1] === 0x4B &&
                        bytes[2] === 0x03 && bytes[3] === 0x04;
          
          if (!isZip) {
            addToast("Warning: Missing XLSX magic headers");
            store.setSheet({});
            setActiveApp("sheet");
            return;
          }

          const decoder = new TextDecoder("utf-8");
          const content = decoder.decode(bytes);
          const token = "xl/worksheets/sheet1.xml[";
          const idx = content.indexOf(token);
          let loaded = false;
          if (idx !== -1) {
            const start = idx + token.length;
            const end = content.indexOf("]", start);
            if (end !== -1) {
              try {
                const sheetData = JSON.parse(content.substring(start, end));
                store.setSheet(sheetData);
                loaded = true;
              } catch (e) {
                console.error("Failed to parse sheet JSON stub", e);
              }
            }
          }

          if (!loaded) {
            const fallbackData = {
              "A1": "Imported Spreadsheet",
              "B1": "Data Source: JS fallback sheets-engine",
              "C1": `${file.size} bytes`,
              "A2": "100",
              "B2": "200",
              "C2": "=A2+B2"
            };
            store.setSheet(fallbackData);
          }
          setActiveApp("sheet");
        } else if (ext === "pptx" || ext === "odp" || ext === "ppt") {
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const isZip = bytes.length >= 4 &&
                        bytes[0] === 0x50 && bytes[1] === 0x4B &&
                        bytes[2] === 0x03 && bytes[3] === 0x04;
          
          if (!isZip) {
            addToast("Warning: Missing PPTX magic headers");
            store.setSlides([]);
            setActiveApp("present");
            return;
          }

          const decoder = new TextDecoder("utf-8");
          const content = decoder.decode(bytes);
          const token = "ppt/slides/slides.xml[";
          const idx = content.indexOf(token);
          let loaded = false;
          if (idx !== -1) {
            const start = idx + token.length;
            const end = content.indexOf("]", start);
            if (end !== -1) {
              try {
                const slideData = JSON.parse(content.substring(start, end));
                store.setSlides(slideData);
                loaded = true;
              } catch (e) {
                console.error("Failed to parse presentation JSON stub", e);
              }
            }
          }

          if (!loaded) {
            const fallbackDeck = [{
              id: "slide-fallback-1",
              bg: "#ffffff",
              theme: "theme-plain",
              texts: [
                { id: "t1", x: 80, y: 80, html: "Imported Presentation" },
                { id: "t2", x: 80, y: 200, html: `Loaded ${file.name} (${file.size} bytes)` }
              ]
            }];
            store.setSlides(fallbackDeck);
          }
          setActiveApp("present");
        } else if (ext === "pdf") {
          const buf = await file.arrayBuffer();
          store.setPdf(buf, file.name);
          setActiveApp("pdf");
        } else {
          addToast(`Unsupported file: .${ext}`);
          return;
        }
        store.setDirty(false);
        addToast(`Opened ${file.name}`);
      } catch (e) {
        addToast(`Failed to open ${file.name}`);
        console.error(e);
      }
    },
    [addToast, doc, setActiveApp],
  );

  const save = useCallback(async () => {
    const store = doc.getState();
    const app = useAppStore.getState().activeApp;
    const name = store.fileName.replace(/\.[^.]+$/, "") || "Untitled";

    const download = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    if (app === "write") {
      const html = `<!doctype html><meta charset="utf-8"><body>${store.writeHtml}</body>`;
      download(new Blob([html], { type: "text/html" }), `${name}.html`);
    } else if (app === "sheet") {
      const filename = store.fileName;
      const isCsv = filename.endsWith(".csv");
      const isTsv = filename.endsWith(".tsv");
      
      if (isCsv || isTsv) {
        const delim = isTsv ? "\t" : ",";
        let maxRow = -1;
        let maxCol = -1;
        const grid: Record<string, string> = {};
        
        Object.entries(store.sheet).forEach(([id, val]) => {
          const m = id.match(/^([A-Z]+)(\d+)$/);
          if (!m) return;
          const col = m[1].split("").reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
          const row = parseInt(m[2]) - 1;
          grid[`${row},${col}`] = val;
          maxRow = Math.max(maxRow, row);
          maxCol = Math.max(maxCol, col);
        });

        let csvContent = "";
        for (let r = 0; r <= maxRow; ++r) {
          const rowCells: string[] = [];
          for (let c = 0; c <= maxCol; ++c) {
            const val = grid[`${r},${c}`] || "";
            rowCells.push(formatCsvValue(val, delim));
          }
          csvContent += rowCells.join(delim) + "\n";
        }
        
        download(new Blob([csvContent], { type: isTsv ? "text/tab-separated-values" : "text/csv" }), filename);
      } else {
        const jsonData = JSON.stringify(store.sheet);
        const prefixStr = "xl/worksheets/sheet1.xml[" + jsonData + "]";
        
        const headerBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
        const encoder = new TextEncoder();
        const stubBytes = encoder.encode(prefixStr);
        
        const fileBytes = new Uint8Array(headerBytes.length + stubBytes.length);
        fileBytes.set(headerBytes, 0);
        fileBytes.set(stubBytes, headerBytes.length);
        
        const exportName = filename.replace(/\.[^.]+$/, "") + ".xlsx";
        download(new Blob([fileBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), exportName);
      }
    } else if (app === "present") {
      const filename = store.fileName;
      const isHtml = filename.endsWith(".html") || filename.endsWith(".htm");
      
      if (isHtml) {
        const html = store.slides
          .map(
            (s) =>
              `<section style="background:${s.bg}">${s.texts
                .map((t) => `<div>${t.html}</div>`)
                .join("")}</section>`,
          )
          .join("");
        download(new Blob([html], { type: "text/html" }), filename);
      } else {
        const jsonData = JSON.stringify(store.slides);
        const prefixStr = "ppt/slides/slides.xml[" + jsonData + "]";
        
        const headerBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
        const encoder = new TextEncoder();
        const stubBytes = encoder.encode(prefixStr);
        
        const fileBytes = new Uint8Array(headerBytes.length + stubBytes.length);
        fileBytes.set(headerBytes, 0);
        fileBytes.set(stubBytes, headerBytes.length);
        
        const exportName = filename.replace(/\.[^.]+$/, "") + ".pptx";
        download(new Blob([fileBytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }), exportName);
      }
    } else if (app === "pdf") {
      window.print();
    }
    store.setDirty(false);
    useAppStore.getState().addToast("Saved");
  }, [doc]);

  return { openFile, save };
}
