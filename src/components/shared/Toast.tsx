import { useAppStore } from "../../store/useAppStore";

export function Toast() {
  const toasts = useAppStore((s) => s.toasts);
  if (!toasts.length) return null;
  return (
    <div className="oct-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="oct-toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
