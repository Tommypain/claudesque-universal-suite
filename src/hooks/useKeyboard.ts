import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

interface Handlers {
  onOpen: () => void;
  onSave: () => void;
  onNew: () => void;
}

export function useKeyboard({ onOpen, onSave, onNew }: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      switch (k) {
        case "o":
          e.preventDefault();
          onOpen();
          break;
        case "s":
          e.preventDefault();
          onSave();
          break;
        case "n":
          e.preventDefault();
          onNew();
          break;
        case "z":
          document.execCommand("undo");
          break;
        case "y":
          document.execCommand("redo");
          break;
        case "p":
          // let browser print
          break;
        case "f":
          // let browser find
          break;
        case ",":
          e.preventDefault();
          useAppStore.getState().toggleSettings(true);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen, onSave, onNew]);
}
