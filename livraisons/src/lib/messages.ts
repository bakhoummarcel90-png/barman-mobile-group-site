import { formatMoney, formatPhone, formatTime, waNumber } from "./format";
import { getCountry, paymentMethodLabel, type CountryConfig } from "./regions";
import type { DeliveryView } from "./types";

/*
 * Aucun SMS ni message WhatsApp n'est envoyé automatiquement : aucun service
 * d'envoi n'est configuré. Ces liens ouvrent l'application du téléphone
 * (WhatsApp, Messages, Téléphone) avec un texte prérempli ; c'est l'utilisateur
 * qui appuie sur « Envoyer ».
 */

export function telLink(phone: string): string {
  return `tel:${phone}`;
}

export function smsLink(phone: string, text: string): string {
  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Ouvre Google Maps sur une recherche d'adresse (lien public, sans clé API). */
export function mapsLink(d: Pick<DeliveryView, "address" | "neighborhood">, city = "Dakar"): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.address}, ${d.neighborhood}, ${city}`)}`;
}

function amountLine(d: DeliveryView, c: CountryConfig): string {
  return d.amount_to_collect > 0
    ? `Montant à régler : ${formatMoney(d.amount_to_collect, c)} (${paymentMethodLabel(c, d.expected_payment_method)}).`
    : "Votre commande est déjà réglée.";
}

/** Message du livreur au client : « je suis en route ». */
export function msgOnTheWay(d: DeliveryView, courierName: string, c = getCountry(null), link?: string): string {
  return `Bonjour ${d.customer_name}, je suis ${courierName}, livreur pour ${d.merchant_name}. Je suis en route avec votre commande ${d.reference}. ${amountLine(d, c)} Merci de rester joignable.${link ? ` Suivez-moi sur la carte : ${link}` : ""}`;
}

/** Message au client quand il est injoignable / adresse à préciser. */
export function msgCantFind(d: DeliveryView, courierName: string): string {
  return `Bonjour ${d.customer_name}, je suis ${courierName}, livreur pour ${d.merchant_name} (commande ${d.reference}). Je n'arrive pas à vous joindre / trouver l'adresse. Pouvez-vous me rappeler ou m'envoyer votre position ?`;
}

/** Message de l'entreprise au client pour annoncer la livraison. */
export function msgScheduled(d: DeliveryView, companyName: string, c = getCountry(null), link?: string): string {
  const when = d.scheduled_at ? ` aujourd'hui vers ${formatTime(d.scheduled_at, c)}` : " prochainement";
  return `Bonjour ${d.customer_name}, ${companyName} vous livrera la commande ${d.reference} de ${d.merchant_name}${when}. ${amountLine(d, c)}${link ? ` Suivez votre livraison : ${link}` : ""}`;
}

/** Message de l'administrateur au livreur avec les détails de la course. */
export function msgToCourier(d: DeliveryView, c = getCountry(null)): string {
  return [
    `Nouvelle course ${d.reference}`,
    `Client : ${d.customer_name} — ${formatPhone(d.customer_phone, c)}`,
    `Adresse : ${d.address}, ${d.neighborhood}`,
    d.access_notes ? `Accès : ${d.access_notes}` : null,
    `À encaisser : ${formatMoney(d.amount_to_collect, c)} (${paymentMethodLabel(c, d.expected_payment_method)})`,
    d.scheduled_at ? `Prévue à ${formatTime(d.scheduled_at, c)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Message au commerçant sur l'issue de la livraison. */
export function msgToMerchant(d: DeliveryView, c = getCountry(null)): string {
  if (d.status === "livree")
    return `Bonjour, la commande ${d.reference} (${d.customer_name}) a été livrée. Montant encaissé : ${formatMoney(d.collected_amount, c)}.`;
  if (d.status === "echec")
    return `Bonjour, la livraison de la commande ${d.reference} (${d.customer_name}) a échoué : ${d.failure_reason ?? "raison non précisée"}.`;
  return `Bonjour, point sur la commande ${d.reference} (${d.customer_name}).`;
}
