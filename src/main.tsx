import "./styles.css";
import "./accessibility.css";
import "./gap-plan-overlays.css";
import "./clean-ui.css";
import "./clean-ui-v2.css";
import "./brand-blue.css";
import "./clean-ui-a11y.css";
import "./landing-mobile-stability.css";
import "./cohesion.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { registerSW } from "virtual:pwa-register";
import { removeBareHash } from "./lib/url";
import { announceAppUpdate } from "./features/pwa/update-events";

import { ensureCampusCatalog } from "./data/campuses";
import { activeCampus, activeUniversity } from "./universities/registry";

function removeStaticSeoMetadata() {
  const comments = [...document.head.childNodes].filter(
    (node): node is Comment => node.nodeType === Node.COMMENT_NODE,
  );
  const start = comments.find((node) => node.data.trim() === "gapwise-static-seo:start");
  const end = comments.find((node) => node.data.trim() === "gapwise-static-seo:end");
  if (!start || !end) return;

  let current = start.nextSibling;
  while (current && current !== end) {
    const next = current.nextSibling;
    current.remove();
    current = next;
  }
  start.remove();
  end.remove();
}

// Generated entry points carry crawler-readable metadata. Once JavaScript takes over,
// remove that static block so TanStack Router owns one canonical set for the active host.
removeStaticSeoMetadata();

function syncUniversityBranding() {
  const university = activeUniversity();
  if (!university || university.id === "uoft") return;
  const prefix = `/universities/${university.id}`;
  const svg = document.getElementById("app-icon-svg") as HTMLLinkElement | null;
  if (svg) svg.href = `${prefix}/logo-mark.svg`;
  const i192 = document.getElementById("app-icon-192") as HTMLLinkElement | null;
  if (i192) i192.href = `${prefix}/favicon-192x192.png`;
  const i32 = document.getElementById("app-icon-32") as HTMLLinkElement | null;
  if (i32) i32.href = `${prefix}/favicon-32x32.png`;
  const i16 = document.getElementById("app-icon-16") as HTMLLinkElement | null;
  if (i16) i16.href = `${prefix}/favicon-16x16.png`;
  const apple = document.getElementById("app-apple-touch-icon") as HTMLLinkElement | null;
  if (apple) apple.href = `${prefix}/apple-touch-icon.png`;
}
syncUniversityBranding();

const university = activeUniversity();

const container = document.getElementById("root");
if (!container) throw new Error("Application root element is missing.");

const canonicalizeBareHash = () => removeBareHash(window.location, window.history);
canonicalizeBareHash();
window.addEventListener("hashchange", canonicalizeBareHash);
if (import.meta.hot) {
  import.meta.hot.dispose(() => window.removeEventListener("hashchange", canonicalizeBareHash));
}

const updateServiceWorker = registerSW({
  onNeedRefresh() {
    announceAppUpdate(() => updateServiceWorker(true));
  },
});

async function startApplication() {
  await ensureCampusCatalog(activeCampus() ?? university?.defaultCampus);
  const router = getRouter();
  createRoot(container!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void startApplication();
