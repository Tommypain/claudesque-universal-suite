import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import LibertyStudio from "../liberty/LibertyStudio";

export const Route = createFileRoute("/liberty")({
  component: LibertyPage,
});

function LibertyPage() {
  return (
    <ClientOnly fallback={<div style={{ padding: 24 }}>Loading Liberty Studio…</div>}>
      <LibertyStudio />
    </ClientOnly>
  );
}
