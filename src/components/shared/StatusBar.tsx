import { useAppStore } from "../../store/useAppStore";
import { useDocumentStore } from "../../store/useDocumentStore";

const APP_META: Record<string, { icon: string; name: string }> = {
  write: { icon: "📝", name: "Write" },
  sheet: { icon: "📊", name: "Sheet" },
  present: { icon: "📽", name: "Present" },
  pdf: { icon: "📄", name: "PDF" },
};

export function StatusBar() {
  const activeApp = useAppStore((s) => s.activeApp);
  const fileName = useDocumentStore((s) => s.fileName);
  const dirty = useDocumentStore((s) => s.dirty);
  const writeHtml = useDocumentStore((s) => s.writeHtml);
  const currentSlide = useDocumentStore((s) => s.currentSlide);
  const slides = useDocumentStore((s) => s.slides);
  const meta = APP_META[activeApp];

  let right = "";
  if (activeApp === "write") {
    const words = writeHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
    right = `${words.length} words`;
  } else if (activeApp === "present") {
    right = `Slide ${currentSlide + 1} / ${slides.length}`;
  } else if (activeApp === "sheet") {
    right = "Ready";
  }

  return (
    <div className="oct-statusbar">
      <div className="oct-status-left">
        <span>{meta.icon}</span>
        <span>{meta.name}</span>
      </div>
      <div className="oct-status-center">{fileName}</div>
      <div className="oct-status-right">
        {right && <span>{right}</span>}
        <span>{dirty ? "Unsaved" : "Saved"}</span>
      </div>
    </div>
  );
}
