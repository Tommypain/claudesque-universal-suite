import { useEffect, useRef } from "react";
import { useFileManager } from "../../hooks/useFileManager";

/** Hidden file input + window drag-and-drop handler. */
export function FileDialog() {
  const { openFile } = useFileManager();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openTrigger = () => inputRef.current?.click();
    window.addEventListener("octopus-open", openTrigger);

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) openFile(file);
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onDragOver);
    return () => {
      window.removeEventListener("octopus-open", openTrigger);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragover", onDragOver);
    };
  }, [openFile]);

  return (
    <input
      ref={inputRef}
      type="file"
      accept="*/*"
      style={{ display: "none" }}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) openFile(file);
        e.target.value = "";
      }}
    />
  );
}
