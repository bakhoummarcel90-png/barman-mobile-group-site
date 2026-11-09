/** Rôles, statuts et transitions autorisées. */

export const ROLES = ["admin", "merchant", "courier"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  merchant: "Commerçant",
  courier: "Livreur",
};

export const DELIVERY_STATUSES = [
  "a_attribuer",
  "attribuee",
  "en_cours",
  "livree",
  "echec",
  "retour_commercant",
  "annulee",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  a_attribuer: "À attribuer",
  attribuee: "Attribuée",
  en_cours: "En cours",
  livree: "Livrée",
  echec: "Échec de livraison",
  retour_commercant: "Retour au commerçant",
  annulee: "Annulée",
};

/** Statuts terminés : plus aucune modification de la commande. */
export const FINAL_STATUSES: DeliveryStatus[] = ["livree", "retour_commercant", "annulee"];

/**
 * Transitions de statut et rôles autorisés à les effectuer.
 * L'administrateur peut tout faire ; le livreur agit sur ses courses ;
 * le commerçant peut seulement annuler tant que la course n'a pas démarré.
 */
export const TRANSITIONS: Record<DeliveryStatus, Partial<Record<DeliveryStatus, Role[]>>> = {
  a_attribuer: { attribuee: ["admin"], annulee: ["admin", "merchant"] },
  attribuee: {
    en_cours: ["admin", "courier"],
    a_attribuer: ["admin"],
    annulee: ["admin", "merchant"],
  },
  en_cours: { livree: ["admin", "courier"], echec: ["admin", "courier"] },
  echec: {
    attribuee: ["admin"],
    retour_commercant: ["admin", "courier"],
    annulee: ["admin"],
  },
  livree: {},
  retour_commercant: {},
  annulee: {},
};

export function canTransition(from: DeliveryStatus, to: DeliveryStatus, role: Role): boolean {
  return TRANSITIONS[from]?.[to]?.includes(role) ?? false;
}

export const PAYMENT_STATUSES = ["non_encaisse", "a_verifier", "confirme", "ecart"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  a_verifier: "À vérifier",
  confirme: "Confirmé",
  ecart: "Écart constaté",
  non_encaisse: "Non encaissé",
};

export const FAILURE_REASONS = [
  "Client injoignable",
  "Client absent",
  "Adresse introuvable",
  "Client a refusé le colis",
  "Client n'avait pas l'argent",
  "Colis endommagé",
  "Reporté à la demande du client",
  "Autre",
];

export function isDeliveryStatus(v: unknown): v is DeliveryStatus {
  return typeof v === "string" && (DELIVERY_STATUSES as readonly string[]).includes(v);
}
export function isPaymentStatus(v: unknown): v is PaymentStatus {
  return typeof v === "string" && (PAYMENT_STATUSES as readonly string[]).includes(v);
}
