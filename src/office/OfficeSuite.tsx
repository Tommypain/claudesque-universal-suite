import { useEffect, useRef } from "react";
import markup from "./markup.html?raw";
import "./office.css";
import "./host.css";

/**
 * Omega Office Suite — hosted faithfully inside React/TanStack.
 *
 * The original single-file app (markup + CSS + vanilla JS) is preserved
 * verbatim. We inject the markup, load the external libraries it depends on,
 * then run the original script in global scope so its inline onclick handlers
 * keep working. This is client-only (touches document/window/localStorage).
 */

const EXTERNAL_STYLES: { id: string; href: string }[] = [
  {
    id: "tabler-icons-css",
    href: "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css",
  },
];

const EXTERNAL_SCRIPTS: { id: string; src: string }[] = [
  { id: "tailwind-cdn", src: "https://cdn.tailwindcss.com" },
  {
    id: "mammoth-lib",
    src: "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js",
  },
  {
    id: "sheetjs-lib",
    src: "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js",
  },
  {
    id: "filesaver-lib",
    src: "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js",
  },
  { id: "docx-lib", src: "https://unpkg.com/docx@8.5.0/build/index.umd.js" },
];

function ensureStyle({ id, href }: { id: string; href: string }) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function ensureScript({ id, src }: { id: string; src: string }) {
  return new Promise<void>((resolve) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // don't block the app if a CDN lib fails
    document.head.appendChild(s);
  });
}

export default function OfficeSuite() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // Drive the design-system classes on <body> (CSS keys off body.app-*/layout-*).
    const body = document.body;
    const prevBodyClass = body.className;
    body.classList.add("app-word", "layout-basic");
    document.documentElement.classList.add("omega-host");

    EXTERNAL_STYLES.forEach(ensureStyle);

    let cancelled = false;
    (async () => {
      await Promise.all(EXTERNAL_SCRIPTS.map(ensureScript));
      if (cancelled) return;
      // Run the original suite script in global scope (after markup is mounted).
      if (!document.getElementById("omega-app-script")) {
        const appScript = document.createElement("script");
        appScript.id = "omega-app-script";
        appScript.src = "/office-suite.js";
        appScript.async = false;
        document.body.appendChild(appScript);
      }
    })();

    return () => {
      cancelled = true;
      body.className = prevBodyClass;
      document.documentElement.classList.remove("omega-host");
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="omega-suite-root"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
