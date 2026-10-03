import { createFileRoute } from "@tanstack/react-router";
import { UniversityDirectory } from "@/components/UniversityDirectory";
import { PUBLIC_FEATURE_PAGES } from "@/content/public-feature-pages";

const canonical = "https://gapwise.ca/universities";
const image = "https://gapwise.ca/og-gapwise.png";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: PUBLIC_FEATURE_PAGES.universities.seoTitle },
      { name: "description", content: PUBLIC_FEATURE_PAGES.universities.description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: PUBLIC_FEATURE_PAGES.universities.seoTitle },
      { property: "og:description", content: PUBLIC_FEATURE_PAGES.universities.description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PUBLIC_FEATURE_PAGES.universities.seoTitle },
      { name: "twitter:description", content: PUBLIC_FEATURE_PAGES.universities.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: canonical }],
  }),
  component: UniversityDirectory,
});
