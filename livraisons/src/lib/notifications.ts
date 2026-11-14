import webpush from "web-push";
import { all, get, run } from "./db";
import type { Actor } from "./types";

/*
 * Notifications des administrateurs :
 *  - dans l'application (cloche + page /notifications) ;
 *  - push sur les appareils où l'administrateur les a activées (téléphone,
 *    ordinateur), même application fermée. Les clés VAPID sont générées
 *    automatiquement au premier usage et gardées en base : aucun compte ni
 *    service payant n'est nécessaire (les navigateurs livrent les messages).
 * Aucun e-mail ni SMS n'est envoyé.
 */

export interface NotificationRow {
  id: number;
  title: string;
  body: string | null;
  url: string | null;
  created_at: string;
  read_at: string | null;
}

function setting(key: string): string | null {
  return get<{ value: string }>("SELECT value FROM app_settings WHERE key = ?", key)?.value ?? null;
}

/** Clés VAPID (générées une fois, conservées en base). */
export function vapidKeys(): { publicKey: string; privateKey: string } {
  let publicKey = setting("vapid_public");
  let privateKey = setting("vapid_private");
  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    run("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('vapid_public', ?), ('vapid_private', ?)", keys.publicKey, keys.privateKey);
    publicKey = setting("vapid_public")!;
    privateKey = setting("vapid_private")!;
  }
  return { publicKey, privateKey };
}

async function sendPush(userIds: number[], payload: { title: string; body: string; url: string }): Promise<void> {
  if (!userIds.length) return;
  const subs = all<{ id: number; endpoint: string; p256dh: string; auth: string }>(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IN (${userIds.map(() => "?").join(",")})`,
    ...userIds,
  );
  if (!subs.length) return;
  const { publicKey, privateKey } = vapidKeys();
  const contact = process.env.LEGAL_CONTACT_EMAIL ? `mailto:${process.env.LEGAL_CONTACT_EMAIL}` : "mailto:notifications@senlivraison.invalid";
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { vapidDetails: { subject: contact, publicKey, privateKey }, TTL: 86400 },
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // Abonnement expiré ou révoqué : on l'oublie.
        if (status === 404 || status === 410) run("DELETE FROM push_subscriptions WHERE id = ?", s.id);
        else console.error("Notification push non envoyée", status ?? err);
      }
    }),
  );
}

/** Notifie tous les administrateurs actifs d'une entreprise (application + push). */
export function notifyAdmins(companyId: number, n: { title: string; body: string; url: string }): void {
  const admins = all<{ id: number }>("SELECT id FROM users WHERE company_id = ? AND role = 'admin' AND active = 1", companyId);
  const now = new Date().toISOString();
  for (const a of admins)
    run("INSERT INTO notifications (company_id, user_id, title, body, url, created_at) VALUES (?, ?, ?, ?, ?, ?)", companyId, a.id, n.title, n.body, n.url, now);
  // Envoi push en arrière-plan : n'empêche jamais l'inscription d'aboutir.
  void sendPush(
    admins.map((a) => a.id),
    n,
  ).catch((err) => console.error("Notifications push", err));
}

/** Notifie une personne précise (application + push). */
export function notifyUser(companyId: number, userId: number, n: { title: string; body: string; url: string }): void {
  run("INSERT INTO notifications (company_id, user_id, title, body, url, created_at) VALUES (?, ?, ?, ?, ?, ?)", companyId, userId, n.title, n.body, n.url, new Date().toISOString());
  void sendPush([userId], n).catch((err) => console.error("Notifications push", err));
}

export function unreadCount(actor: Actor): number {
  if (actor.role !== "admin" && actor.role !== "gp") return 0;
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL", actor.id)!.n;
}

export function listNotifications(actor: Actor, limit = 50): NotificationRow[] {
  return all<NotificationRow>(
    "SELECT id, title, body, url, created_at, read_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    actor.id,
    limit,
  );
}

export function markAllRead(actor: Actor): void {
  run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", new Date().toISOString(), actor.id);
}

export function savePushSubscription(actor: Actor, sub: { endpoint: string; p256dh: string; auth: string }): void {
  if (!/^https:\/\/[^\s]{10,2000}$/.test(sub.endpoint) || !sub.p256dh || !sub.auth || sub.p256dh.length > 200 || sub.auth.length > 100)
    throw new Error("Abonnement invalide");
  run(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    actor.id,
    sub.endpoint,
    sub.p256dh,
    sub.auth,
  );
}

export function deletePushSubscription(actor: Actor, endpoint: string): void {
  run("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?", actor.id, endpoint);
}

export function pushDeviceCount(actor: Actor): number {
  return get<{ n: number }>("SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?", actor.id)!.n;
}

/** Envoie une notification de test aux appareils de l'utilisateur. */
export async function sendTestPush(actor: Actor): Promise<void> {
  await sendPush([actor.id], { title: "SenLivraison", body: "Les notifications fonctionnent sur cet appareil.", url: "/notifications" });
}
