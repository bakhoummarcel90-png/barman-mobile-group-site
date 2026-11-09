/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Ce dossier est une application autonome dans le dépôt du site vitrine.
  turbopack: { root: __dirname },
  // Les photos de preuve sont compressées dans le navigateur (≈ 300 Ko),
  // mais on laisse une marge pour les téléphones qui ne savent pas compresser.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

module.exports = nextConfig;
