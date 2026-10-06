import type { MetadataRoute } from "next";
import { LEGAL_PAGES, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    ...LEGAL_PAGES.map((page) => ({
      url: `${SITE.url}${page.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
