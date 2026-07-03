import { useEffect, useRef } from "react";
import { useFileManager, useAppStore } from "@liberty/shared-hooks";

/**
 * LibertyFileDialog — invisible component that handles file open events
 * for Liberty Studio.
 *
 * It listens for the custom `liberty-open` DOM event (dispatched by
 * keyboard shortcuts or menu actions) and shows a native file picker.
 *
 * Supported formats:
 *  Docs   → .docx .odt .rtf .txt .html
 *  Sheets → .xlsx .ods .csv
 *  PDF    → .pdf
 */
export function LibertyFileDialog() {
  const { openFile } = useFileManager();
  const addToast = useAppStore((s: any) => s.addToast);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Lazily create the hidden file input once
  useEffect(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      ".docx,.odt,.rtf,.txt,.html,.htm,.xlsx,.ods,.csv,.pdf,.pptx,.odp";
    input.style.display = "none";
    input.multiple = false;
    document.body.appendChild(input);
    inputRef.current = input;

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await openFile(file);
      } catch {
        addToast("Failed to open file");
      }
      // Reset so the same file can be opened again
      input.value = "";
    });

    return () => {
      input.remove();
    };
  }, [openFile, addToast]);

  // Listen for the custom open event dispatched by keyboard handler or menus
  useEffect(() => {
    const handleOpen = () => {
      inputRef.current?.click();
    };
    window.addEventListener("liberty-open", handleOpen);
    return () => window.removeEventListener("liberty-open", handleOpen);
  }, []);

  return null; // No visible UI — purely event-driven
}
