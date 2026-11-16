/** Nom et adresse publics de l'application (aperçus de liens, Google, icône du téléphone). */
export const SITE_NAME = "Sen Service Livraisons";
export const SITE_SHORT_NAME = "Sen Service";
export const SITE_DESCRIPTION =
  "Votre GP en ligne : envoyez vos colis entre le Sénégal et l'étranger avec des GP vérifiés. Prix au kilo affiché, réservation en 1 minute.";

/** Adresse publique du site (PUBLIC_URL chez l'hébergeur, sinon l'adresse Railway actuelle). */
export function siteUrl(): string {
  return (process.env.PUBLIC_URL || "https://senservicelivraison.up.railway.app").replace(/\/+$/, "");
}
