import { useRef, useState } from "react";
import { Ribbon } from "../ribbon/Ribbon";
import { RibbonGroup } from "../ribbon/RibbonGroup";
import { RibbonButton } from "../ribbon/RibbonButton";
import { useDocumentStore } from "../../store/useDocumentStore";

const THEMES: Record<string, { bg: string; color: string }> = {
  "theme-plain": { bg: "#ffffff", color: "#111111" },
  "theme-dark": { bg: "#1a1a1a", color: "#f0f0f0" },
  "theme-ocean": { bg: "#0f3460", color: "#ffffff" },
  "theme-sunset": { bg: "#b45309", color: "#fff7ed" },
  "theme-forest": { bg: "#14532d", color: "#ecfdf5" },
};

export function PresentApp() {
  const slides = useDocumentStore((s) => s.slides);
  const current = useDocumentStore((s) => s.currentSlide);
  const addSlide = useDocumentStore((s) => s.addSlide);
  const deleteSlide = useDocumentStore((s) => s.deleteSlide);
  const setCurrent = useDocumentStore((s) => s.setCurrentSlide);
  const updateSlide = useDocumentStore((s) => s.updateSlide);
  const stageRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  const slide = slides[current];

  const addText = () => {
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
        <RibbonButton icon="➕" label="Add slide" size="large" onClick={addSlide} />
        <RibbonButton icon="🗑" label="Delete" size="large" onClick={() => deleteSlide(current)} />
      </RibbonGroup>
      <RibbonGroup label="Insert">
        <RibbonButton icon="🔤" label="Text box" size="large" onClick={addText} />
      </RibbonGroup>
      <RibbonGroup label="Design">
        <label className="oct-rbtn" title="Background">
          <span className="ic">🎨</span>
          <span>Background</span>
          <input
            type="color"
            value={slide?.bg ?? "#ffffff"}
            style={{ width: 24, height: 18, border: "none" }}
            onChange={(e) => updateSlide(current, { bg: e.target.value })}
          />
        </label>
      </RibbonGroup>
      <RibbonGroup label="Present">
        <RibbonButton icon="▶" label="Slideshow" size="large" onClick={startShow} />
      </RibbonGroup>
    </>
  );

  const designTab = (
    <RibbonGroup label="Themes">
      {Object.entries(THEMES).map(([key, t]) => (
        <RibbonButton
          key={key}
          icon={<span style={{ background: t.bg, width: 18, height: 18, display: "inline-block", borderRadius: 4 }} />}
          label={key.replace("theme-", "")}
          onClick={() => updateSlide(current, { theme: key, bg: t.bg })}
        />
      ))}
    </RibbonGroup>
  );

  const theme = THEMES[slide?.theme ?? "theme-plain"] ?? THEMES["theme-plain"];

  return (
    <>
      <Ribbon
        tabs={[
          { id: "home", label: "Home", content: homeTab },
          { id: "design", label: "Design", content: designTab },
        ]}
      />
      <div className="oct-workspace" style={{ padding: 16 }}>
        <div className="oct-present-layout">
          <div className="oct-slide-list">
            {slides.map((s, i) => {
              const th = THEMES[s.theme] ?? THEMES["theme-plain"];
              return (
                <div
                  key={s.id}
                  className={`oct-slide-thumb${i === current ? " active" : ""}`}
                  style={{ background: s.bg, color: th.color }}
                  onClick={() => setCurrent(i)}
                >
                  <span style={{ position: "absolute", top: 2, left: 4 }}>{i + 1}</span>
                  <div style={{ padding: 12, fontSize: 8 }}>
                    {s.texts[0]?.html?.replace(/<[^>]+>/g, "").slice(0, 30)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="oct-slide-stage">
            <div
              ref={stageRef}
              className="oct-slide"
              style={{ background: slide?.bg, color: theme.color }}
              onKeyDown={(e) => {
                if (!show) return;
                if (e.key === "ArrowRight") setCurrent(Math.min(slides.length - 1, current + 1));
                if (e.key === "ArrowLeft") setCurrent(Math.max(0, current - 1));
                if (e.key === "Escape") setShow(false);
              }}
              tabIndex={0}
            >
              {slide?.texts.map((t) => (
                <div
                  key={t.id}
                  className="oct-textbox"
                  contentEditable
                  suppressContentEditableWarning
                  style={{ left: t.x, top: t.y, fontSize: t.id === "t1" ? 40 : 22 }}
                  onBlur={(e) =>
                    updateSlide(current, {
                      texts: slide.texts.map((x) =>
                        x.id === t.id ? { ...x, html: e.currentTarget.innerHTML } : x,
                      ),
                    })
                  }
                  dangerouslySetInnerHTML={{ __html: t.html }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
