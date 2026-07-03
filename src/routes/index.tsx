import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import OfficeSuite from "../office/OfficeSuite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claudesque — Universal Office Suite" },
      {
        name: "description",
        content:
          "Claudesque is a free browser-based office suite with Word, Impress, Sheet and PDF apps. Works on any device.",
      },
      { property: "og:title", content: "Claudesque Office Suite" },
      {
        property: "og:description",
        content: "Word, Impress, Sheet and PDF — a free office suite in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div style={{ padding: 24 }}>Loading Claudesque…</div>}>
      <OfficeSuite />
    </ClientOnly>
  );
}
