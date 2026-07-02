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
        } else if (ext === "csv") {
          const text = await file.text();
          const data: Record<string, string> = {};
          text.split(/\r?\n/).forEach((line, r) => {
            line.split(",").forEach((val, c) => {
              if (val !== "") data[`${colName(c)}${r + 1}`] = val;
            });
          });
          store.setSheet(data);
          setActiveApp("sheet");
        } else if (ext === "xlsx" || ext === "xls") {
          await ensureScript(
            "sheetjs-lib",
            "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js",
          );
          const buf = await file.arrayBuffer();
          // @ts-expect-error cdn global
          const wb = window.XLSX.read(buf, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // @ts-expect-error cdn global
          const rows: string[][] = window.XLSX.utils.sheet_to_json(ws, {
            header: 1,
            raw: false,
          });
          const data: Record<string, string> = {};
          rows.forEach((row, r) =>
            row.forEach((val, c) => {
              if (val != null && val !== "")
                data[`${colName(c)}${r + 1}`] = String(val);
            }),
          );
          store.setSheet(data);
          setActiveApp("sheet");
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
      await ensureScript(
        "sheetjs-lib",
        "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js",
      );
      const aoa: string[][] = [];
      Object.entries(store.sheet).forEach(([id, val]) => {
        const m = id.match(/^([A-Z]+)(\d+)$/);
        if (!m) return;
        const col =
          m[1].split("").reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0) -
          1;
        const row = parseInt(m[2]) - 1;
        aoa[row] = aoa[row] || [];
        aoa[row][col] = val;
      });
      // @ts-expect-error cdn global
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      // @ts-expect-error cdn global
      const wb = window.XLSX.utils.book_new();
      // @ts-expect-error cdn global
      window.XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      // @ts-expect-error cdn global
      window.XLSX.writeFile(wb, `${name}.xlsx`);
    } else if (app === "present") {
      const html = store.slides
        .map(
          (s) =>
            `<section style="background:${s.bg}">${s.texts
              .map((t) => `<div>${t.html}</div>`)
              .join("")}</section>`,
        )
        .join("");
      download(new Blob([html], { type: "text/html" }), `${name}.html`);
    } else if (app === "pdf") {
      window.print();
    }
    store.setDirty(false);
    useAppStore.getState().addToast("Saved");
  }, [doc]);

  return { openFile, save };
}
