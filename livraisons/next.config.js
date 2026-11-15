/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ce dossier est une application autonome dans le dépôt du site vitrine.
  turbopack: { root: __dirname },
  // Les photos de preuve sont compressées dans le navigateur (≈ 300 Ko),
  // mais on laisse une marge pour les téléphones qui ne savent pas compresser.
  // En-têtes de sécurité sur toutes les pages.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Interdit d'afficher l'application dans le cadre d'un autre site (« clickjacking »).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Localisation et appareil photo : seulement pour ce site (GPS du livreur, photo de preuve).
          { key: "Permissions-Policy", value: "geolocation=(self), camera=(self), microphone=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

module.exports = nextConfig;
