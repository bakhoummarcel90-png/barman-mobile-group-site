/**
 * Coordonnées de l'éditeur de l'application, affichées dans les pages légales
 * exigées par les stores. À renseigner chez l'hébergeur :
 *   LEGAL_EDITOR_NAME     ex. « Barman Mobile Group SARL »
 *   LEGAL_EDITOR_ADDRESS  ex. « Dakar, Sénégal »
 *   LEGAL_CONTACT_EMAIL   adresse qui reçoit les demandes (confidentialité, suppression)
 */
export function legalInfo() {
  return {
    editor: process.env.LEGAL_EDITOR_NAME?.trim() || null,
    address: process.env.LEGAL_EDITOR_ADDRESS?.trim() || null,
    email: process.env.LEGAL_CONTACT_EMAIL?.trim() || null,
  };
}
