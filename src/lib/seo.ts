import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

// Open Graph commun à tout le site, sans URL (chaque page fournit la sienne).
export const defaultOpenGraph = {
  title: `${siteConfig.name} — ${siteConfig.slogan}`,
  description: siteConfig.description,
  siteName: siteConfig.name,
  locale: "fr_SN",
  type: "website",
  images: [
    {
      url: "/images/hero-barman-mobile.webp",
      width: 2000,
      height: 1324,
      alt: "Barman Mobile Group en prestation à Dakar",
    },
  ],
} satisfies OpenGraph;

/**
 * Open Graph d'une page : reprend les valeurs communes (image, nom du site…)
 * et fixe og:url sur le chemin canonique de la page. Next.js remplace l'objet
 * openGraph du layout au lieu de le fusionner, d'où ce helper.
 */
export function pageOpenGraph(path: string, overrides: Partial<OpenGraph> = {}): OpenGraph {
  return { ...defaultOpenGraph, ...overrides, url: path } as OpenGraph;
}
