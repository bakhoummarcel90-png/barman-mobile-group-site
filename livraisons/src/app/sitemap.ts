import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Plan du site pour Google : uniquement les pages publiques. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/voyages`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/suivi`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/conditions`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
