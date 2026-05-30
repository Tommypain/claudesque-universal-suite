import { useEffect, useRef } from "react";
import markup from "./markup.html?raw";
import "./office.css";
import "./host.css";

/**
 * Omega Office Suite — hosted faithfully inside React/TanStack.
 *
 * IMPORTANT: the original single-file app builds large parts of its UI
 * imperatively (Word pages, the spreadsheet grid, slides, PDF pages…).
 * If we let React own the markup via `dangerouslySetInnerHTML`, every
 * re-render (e.g. StrictMode's double mount) reconciles the subtree and
 * WIPES everything the vanilla script injected — empty workspaces and
 * dead-looking buttons. So we inject the markup ONCE into a ref'd div
 * that React never reconciles, then load the libs + the app script.
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
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = false;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => resolve(); // don't block the app if a CDN lib fails
    document.head.appendChild(s);
  });
}

// Module-level guard so StrictMode's double-invoke can't boot twice.
let booted = false;

export default function OfficeSuite() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Always make sure the design-system body/html classes are present.
    const body = document.body;
    if (!Array.from(body.classList).some((c) => c.startsWith("app-"))) {
      body.classList.add("app-word");
    }
    if (!Array.from(body.classList).some((c) => c.startsWith("layout-"))) {
      body.classList.add("layout-basic");
    }
    document.documentElement.classList.add("omega-host");

    if (booted) {
      // Re-attach the already-built DOM if React replaced our node.
      if (!container.firstChild && window.__omegaRoot) {
        container.appendChild(window.__omegaRoot);
      }
      return;
    }
    booted = true;

    // Inject the markup ONCE, imperatively — React will not reconcile it.
    container.innerHTML = markup;
    window.__omegaRoot = container.firstElementChild as HTMLElement | undefined;

    EXTERNAL_STYLES.forEach(ensureStyle);

    (async () => {
      await Promise.all(EXTERNAL_SCRIPTS.map(ensureScript));
      if (!document.getElementById("omega-app-script")) {
        const appScript = document.createElement("script");
        appScript.id = "omega-app-script";
        appScript.src = "/office-suite.js";
        appScript.async = false;
        document.body.appendChild(appScript);
      }
    })();

    // No destructive cleanup: this is a single-route app and the suite owns
    // the document classes for its whole lifetime.
  }, []);

  return <div ref={containerRef} className="omega-suite-root" />;
}

declare global {
  interface Window {
    __omegaRoot?: HTMLElement;
  }
}
