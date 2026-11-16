import type { MetadataRoute } from "next";

/** Manifeste d'application : rend Sen Service Livraisons installable (écran d'accueil, Play Store via TWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sen Service Livraisons",
    short_name: "Sen Service",
    description: "Votre GP en ligne : envoyez vos colis entre le Sénégal et l'étranger avec des GP vérifiés. Livraisons à Dakar.",
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
