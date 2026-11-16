import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Google peut parcourir les pages publiques ; les espaces privés et les API sont exclus. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/voyages", "/inscription", "/conditions", "/confidentialite", "/suppression-compte", "/suivi", "/connexion"],
        disallow: ["/api/", "/installation", "/livraison/", "/gp/", "/tableau-de-bord", "/commandes", "/livraisons", "/colis", "/encaissements", "/livreurs", "/commercants", "/parametres", "/mon-compte", "/notifications"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
