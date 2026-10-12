import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { services } from "@/config/services";

// Uniquement des URL canoniques (domaine www, sans slash final), en 200 et
// indexables. Pas de lastModified : new Date() changeait la date à chaque
// build, ce qui rend l'information non fiable pour Google.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/services",
    "/realisations",
    "/formules",
    "/devis",
    "/academie",
    "/a-propos",
    "/notre-histoire",
    "/contact",
    "/faq",
    "/mentions-legales",
    "/politique-confidentialite",
  ].map((path) => ({
    url: `${siteConfig.url}${path}`,
  }));

  const serviceRoutes = services.map((s) => ({
    url: `${siteConfig.url}/services/${s.slug}`,
  }));

  return [...staticRoutes, ...serviceRoutes];
}
