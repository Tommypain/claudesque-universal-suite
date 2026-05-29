import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import OfficeSuite from "../office/OfficeSuite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Omega Office Suite — Word, Sheet, Impress & PDF" },
      {
        name: "description",
        content:
          "A beautiful, Claude-inspired office suite: word processor, spreadsheets, presentations and PDF editing — works on any device.",
      },
      { property: "og:title", content: "Omega Office Suite" },
      {
        property: "og:description",
        content:
          "A beautiful, Claude-inspired office suite that runs on any platform.",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly
      fallback={
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            color: "#7a7a7a",
            background: "#f3f3ee",
          }}
        >
          Loading Omega Office Suite…
        </div>
      }
    >
      <OfficeSuite />
    </ClientOnly>
  );
}
