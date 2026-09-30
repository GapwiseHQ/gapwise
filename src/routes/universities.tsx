import { createFileRoute } from "@tanstack/react-router";
import { PublicFeaturePage } from "@/components/PublicFeaturePage";
import { PUBLIC_FEATURE_PAGES } from "@/content/public-feature-pages";

export const Route = createFileRoute("/universities")({
  head: () => ({
    meta: [
      { title: PUBLIC_FEATURE_PAGES.universities.seoTitle },
      { name: "description", content: PUBLIC_FEATURE_PAGES.universities.description },
    ],
  }),
  component: () => <PublicFeaturePage page={PUBLIC_FEATURE_PAGES.universities} />,
});
