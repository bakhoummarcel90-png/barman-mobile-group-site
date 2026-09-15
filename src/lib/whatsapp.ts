import { siteConfig } from "@/config/site";

/**
 * Construit un lien WhatsApp (wa.me) à partir d'un numéro et d'un message.
 * Le numéro doit être fourni au format international (espaces tolérés).
 */
export function buildWhatsAppLink(message: string, phone: string = siteConfig.whatsappPreferredNumber) {
  const digitsOnly = phone.replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digitsOnly}?text=${encoded}`;
}

export type QuoteFormData = {
  nom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  typeClient: string;
  typeEvenement: string;
  date: string;
  lieu: string;
  invites: string;
  heureDebut: string;
  duree: string;
  services: string[];
  formuleBoissons: string;
  produitsFournis: string;
  location: string;
  personnel: string;
  budget: string;
  message: string;
};

export function buildQuoteWhatsAppMessage(data: QuoteFormData) {
  const lignes = [
    `Bonjour Barman Mobile Group, je souhaite une demande de devis :`,
    ``,
    `• Nom : ${data.nom || "—"}`,
    `• Téléphone : ${data.telephone || "—"}`,
    `• WhatsApp : ${data.whatsapp || "—"}`,
    `• E-mail : ${data.email || "—"}`,
    `• Type de client : ${data.typeClient || "—"}`,
    `• Type d'événement : ${data.typeEvenement || "—"}`,
    `• Date : ${data.date || "—"}`,
    `• Lieu : ${data.lieu || "—"}`,
    `• Nombre d'invités : ${data.invites || "—"}`,
    `• Heure de début : ${data.heureDebut || "—"}`,
    `• Durée souhaitée : ${data.duree || "—"}`,
    `• Services demandés : ${data.services.length ? data.services.join(", ") : "—"}`,
    `• Boissons : ${data.formuleBoissons || "—"}`,
    `• Produits fournis : ${data.produitsFournis || "—"}`,
    `• Location de matériel : ${data.location || "—"}`,
    `• Besoin en personnel : ${data.personnel || "—"}`,
    `• Budget indicatif : ${data.budget || "—"}`,
    `• Message : ${data.message || "—"}`,
  ];
  return lignes.join("\n");
}
