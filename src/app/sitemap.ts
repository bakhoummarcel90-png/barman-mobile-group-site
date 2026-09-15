import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { services } from "@/config/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/services",
    "/realisations",
    "/formules",
    "/devis",
    "/a-propos",
    "/notre-histoire",
    "/contact",
    "/faq",
    "/mentions-legales",
    "/politique-confidentialite",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${siteConfig.url}/services/${s.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...serviceRoutes];
}
