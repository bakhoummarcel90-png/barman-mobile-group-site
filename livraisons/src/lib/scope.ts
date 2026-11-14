import type { SqlValue } from "./db";
import type { Actor } from "./types";

/**
 * Filtre d'accès aux livraisons, appliqué à TOUTES les requêtes :
 *  - toujours limité à l'entreprise de l'utilisateur ;
 *  - un commerçant ne voit que les commandes de sa boutique ;
 *  - un livreur ne voit que les livraisons qui lui sont attribuées.
 */
export function deliveryScope(actor: Actor, alias = "d"): { sql: string; params: SqlValue[] } {
  const parts = [`${alias}.company_id = ?`];
  const params: SqlValue[] = [actor.companyId];
  if (actor.role === "merchant") {
    parts.push(`${alias}.merchant_id = ?`);
    params.push(actor.merchantId ?? -1);
  } else if (actor.role === "courier") {
    parts.push(`${alias}.courier_id = ?`);
    params.push(actor.id);
  } else if (actor.role !== "admin") {
    parts.push("0"); // GP : aucune livraison
  }
  return { sql: parts.join(" AND "), params };
}
