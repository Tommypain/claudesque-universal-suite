/**
 * ensureScript — shared utility for dynamically loading an external script.
 * Deduplicates script insertion: if the script is already present and loaded,
 * resolves immediately. If present but still loading, waits for its load event.
 * Used by both OfficeSuite (legacy) and useFileManager (Octopus/Liberty).
 */
export function ensureScript(id: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
      }
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
