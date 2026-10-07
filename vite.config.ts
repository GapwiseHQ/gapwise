import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { lovableAssetsProxyPlugin } from "@lovable.dev/vite-tanstack-config";
import manifest from "./universities.json" with { type: "json" };

/**
 * Client-only build: routing, ICS parsing, route calculation, and Supabase calls run in the
 * browser. `bun run build` emits the static `dist/` deployed by Vercel.
 */
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
        globIgnores: ["**/campus-*.js", "**/catalog-*.js"],
        navigateFallback: "/index.html",
        // Never let the app-shell service worker intercept crawler-facing static endpoints.
        // This also keeps direct browser navigation to these files truthful after a deployment.
        navigateFallbackDenylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(?:campus|catalog)-.*\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "campus-datasets",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*$/,
            handler: "NetworkOnly",
            options: {
              cacheName: "openfreemap-tiles",
            },
          },
        ],
      },
    }),
    lovableAssetsProxyPlugin(),
    {
      name: "gapwise-preview-routing",
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (!req.url) return next();
          const parsed = new URL(req.url, "http://localhost");
          const requestHost = (req.headers.host || "").toLowerCase().split(":")[0] ?? "";
          const canonicalHost = requestHost.endsWith(".localhost")
            ? `${requestHost.slice(0, -".localhost".length)}.gapwise.ca`
            : requestHost === "localhost" || requestHost === "127.0.0.1"
              ? "gapwise.ca"
              : requestHost;
          const site = manifest.sites.find((candidate) => candidate.hosts.includes(canonicalHost));
          const queryUni = parsed.searchParams.get("university");
          const queryCampus = parsed.searchParams.get("campus");
          const querySite = parsed.searchParams.get("site");
          const selectedSite = querySite
            ? querySite === "global"
              ? manifest.sites.find((candidate) => candidate.role === "global")
              : manifest.sites.find((candidate) => candidate.id === querySite)
            : queryCampus
              ? manifest.sites.find((candidate) => candidate.campusId === queryCampus)
              : queryUni
                ? manifest.sites.find(
                    (candidate) =>
                      candidate.universityId === queryUni &&
                      (candidate.role === "university-hub" ||
                        candidate.role === "single-campus-edition"),
                  )
                : site;
          const siteKey =
            selectedSite?.role === "global" ? undefined : selectedSite?.canonicalHost.split(".")[0];
          const entryPoint = siteKey ? `/_sites/${siteKey}/index.html` : "/_seo/index.html";
          const selectedUniversity = manifest.universities.find(
            (university) => university.id === selectedSite?.universityId,
          );
          const assetUniversityId =
            selectedUniversity?.status === "planned" ? undefined : selectedUniversity?.id;

          if (
            parsed.pathname === "/" ||
            parsed.pathname === "" ||
            parsed.pathname === "/index.html"
          ) {
            req.url = entryPoint;
          } else if (parsed.pathname === "/og-card.png" || parsed.pathname === "/og-gapwise.png") {
            req.url = assetUniversityId
              ? `/universities/${assetUniversityId}/og-card.png`
              : "/_global/og-gapwise.png";
          } else if (
            !parsed.pathname.includes(".") &&
            !parsed.pathname.startsWith("/api") &&
            !parsed.pathname.startsWith("/v1")
          ) {
            req.url = entryPoint;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    manifest: true,
  },
});
