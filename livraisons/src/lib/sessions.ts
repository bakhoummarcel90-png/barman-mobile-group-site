import { run } from "./db";

/** Déconnecte toutes les sessions d'un utilisateur (désactivation, nouveau mot de passe). */
export function revokeSessionsFor(userId: number): void {
  run("DELETE FROM sessions WHERE user_id = ?", userId);
}
