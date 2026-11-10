import type { MetadataRoute } from "next";

/** Manifeste d'application : rend SenLivraison installable (écran d'accueil, Play Store via TWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SenLivraison — gestion des livraisons",
    short_name: "SenLivraison",
    description: "Commandes, livreurs, encaissements et colis internationaux pour les entreprises de livraison en Afrique de l'Ouest.",
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0b8a6b",
    categories: ["business", "productivity", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
