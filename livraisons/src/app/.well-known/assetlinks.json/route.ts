/**
 * Digital Asset Links : prouve à Android que l'application du Play Store et ce
 * site appartiennent au même éditeur (application « TWA » plein écran).
 *
 * À configurer chez l'hébergeur, après création de l'application Android :
 *   ANDROID_PACKAGE_NAME          ex. com.votreentreprise.senlivraison
 *   ANDROID_SHA256_FINGERPRINTS   empreinte(s) SHA-256 de la clé de signature,
 *                                 séparées par des virgules (Play Console →
 *                                 Intégrité de l'application → Signature d'application)
 * Sans ces variables, la liste est vide.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = process.env.ANDROID_PACKAGE_NAME?.trim();
  const prints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body =
    pkg && prints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints },
          },
        ]
      : [];
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
