import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import OctopusStudio from "../octopus/OctopusStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Octopus Studio — Free Online Office Suite" },
      {
        name: "description",
        content:
          "Octopus Studio is a free browser-based office suite with Write, Sheet, Present and PDF apps. Works on any device.",
      },
      { property: "og:title", content: "Octopus Studio" },
      {
        property: "og:description",
        content: "Write, Sheet, Present and PDF — a free office suite in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div style={{ padding: 24 }}>Loading Octopus Studio…</div>}>
      <OctopusStudio />
    </ClientOnly>
  );
}
