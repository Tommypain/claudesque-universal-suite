import { useRef, useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { useDocumentStore } from "../../store/useDocumentStore";
import { Play } from "lucide-react";

const THEMES: Record<string, { bg: string; color: string }> = {
  "theme-plain": { bg: "#ffffff", color: "#111111" },
  "theme-dark": { bg: "#1a1a1a", color: "#f0f0f0" },
  "theme-ocean": { bg: "#0f3460", color: "#ffffff" },
  "theme-sunset": { bg: "#b45309", color: "#fff7ed" },
  "theme-forest": { bg: "#14532d", color: "#ecfdf5" },
};

interface LibertyImpressAppProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * LibertyImpressApp — The React presentation component matching the visual styling,
 * structure, and DOM classes of the OfficeSuite Presentation (Impress).
 */
export function LibertyImpressApp({
  activeTab,
  setActiveTab,
  onSave,
  onUndo,
  onRedo,
}: LibertyImpressAppProps) {
  const slides = useDocumentStore((s) => s.slides);
  const current = useDocumentStore((s) => s.currentSlide);
  const addSlide = useDocumentStore((s) => s.addSlide);
  const deleteSlide = useDocumentStore((s) => s.deleteSlide);
  const setCurrent = useDocumentStore((s) => s.setCurrentSlide);
  const updateSlide = useDocumentStore((s) => s.updateSlide);
  const stageRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  const slide = slides[current] ?? slides[0];

  const addText = () => {
    if (!slide) return;
    updateSlide(current, {
      texts: [
        ...slide.texts,
        {
          id: Math.random().toString(36).slice(2),
          x: 120,
          y: 120,
          html: "New text",
        },
      ],
    });
  };

  const startShow = async () => {
    const el = stageRef.current;
    if (el) {
      await el.requestFullscreen?.();
      setShow(true);
    }
  };

  const homeTab = (
    <>
      <RibbonGroup label="Slides">
        <RibbonButton icon="➕" label="New Slide" size="large" onClick={addSlide} />
        <RibbonButton icon="🗑️" label="Delete" size="large" onClick={() => deleteSlide(current)} />
      </RibbonGroup>
      <RibbonGroup label="Insert">
        <RibbonButton icon="🔤" label="Text Box" size="large" onClick={addText} />
      </RibbonGroup>
      <RibbonGroup label="Design">
        <label className="btn bsm" title="Background" style={{ display: "inline-flex", gap: "4px", alignItems: "center", cursor: "pointer" }}>
          <span>Background</span>
          <input
            type="color"
            value={slide?.bg ?? "#ffffff"}
            style={{ width: 24, height: 18, border: "none", background: "transparent" }}
            onChange={(e) => updateSlide(current, { bg: e.target.value })}
          />
        </label>
      </RibbonGroup>
      <RibbonGroup label="Present">
        <RibbonButton icon={<Play size={16} />} label="Slideshow" size="large" onClick={startShow} />
      </RibbonGroup>
    </>
  );

  const designTab = (
    <RibbonGroup label="Themes">
      {Object.entries(THEMES).map(([key, t]) => (
        <RibbonButton
          key={key}
          icon={<span style={{ background: t.bg, width: 18, height: 18, display: "inline-block", borderRadius: 4, border: "1px solid #ccc" }} />}
          label={key.replace("theme-", "")}
          onClick={() => updateSlide(current, { theme: key, bg: t.bg })}
        />
      ))}
    </RibbonGroup>
  );

  const currentTheme = THEMES[slide?.theme ?? "theme-plain"] ?? THEMES["theme-plain"];

  return (
    <>
      <Ribbon
        tabs={[
          { id: "impress-home", label: "Home", content: homeTab },
          { id: "impress-design", label: "Design", content: designTab },
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSave={onSave}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      <div className="workspace-view active" id="view-impress">
        <div className="impress-canvas" style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Thumbnails Sidebar */}
          <div className="impress-sidebar" id="impress-slides-sidebar" style={{ width: "170px", overflowY: "auto", background: "var(--color-background-secondary)", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {slides.map((sl, idx) => (
              <div
                key={sl.id}
                className={`slide-thumbnail ${idx === current ? "active" : ""}`}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: sl.bg,
                  border: idx === current ? "2px solid var(--color-accent, #2563eb)" : "1px solid var(--color-border-secondary)",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#aaa",
                }}
                onClick={() => setCurrent(idx)}
              >
                Slide {idx + 1}
              </div>
            ))}
          </div>

          {/* Slide Stage */}
          <div className="impress-main-view" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#eaeae4", padding: 16 }}>
            <div className="impress-slide-stage" id="impress-slide-stage" style={{ width: "100%", maxWidth: "800px", aspectRatio: "16/9", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: 4 }}>
              <div
                ref={stageRef}
                className="impress-slide"
                id="impress-slide-viewport"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: slide?.bg ?? "#ffffff",
                  color: currentTheme.color,
                  position: "relative",
                  overflow: "hidden",
                  padding: 40,
                }}
              >
                {slide?.texts.map((t) => (
                  <div
                    key={t.id}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      position: "absolute",
                      left: t.x,
                      top: t.y,
                      outline: "none",
                      fontSize: t.id === "t1" ? "24px" : "16px",
                      fontWeight: t.id === "t1" ? "bold" : "normal",
                    }}
                    dangerouslySetInnerHTML={{ __html: t.html }}
                    onBlur={(e) => {
                      const updatedTexts = slide.texts.map((txt) =>
                        txt.id === t.id ? { ...txt, html: e.target.innerHTML } : txt
                      );
                      updateSlide(current, { texts: updatedTexts });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
