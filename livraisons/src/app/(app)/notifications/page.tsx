import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { markAllReadAction } from "@/app/actions";
import { PushSettings } from "@/components/PushSettings";
import { Card, EmptyState, PageHeader, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { formatDateTime, formatRelative } from "@/lib/format";
import { listNotifications, pushDeviceCount, unreadCount, vapidKeys } from "@/lib/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  const items = listNotifications(user, 60);
  const unread = unreadCount(user);
  const devices = pushDeviceCount(user);
  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} non lue(s)` : "Tout est lu"}
        actions={
          unread ? (
            <form action={markAllReadAction}>
              <button type="submit" className="btn-secondary">
                Tout marquer comme lu
              </button>
            </form>
          ) : null
        }
      />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {items.length ? (
            <ul className="card divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id}>
                  {/* Lien simple (pas de pré-chargement) : la notification n'est marquée lue qu'au vrai clic. */}
                  <a href={`/notifications-ouvrir?id=${n.id}`} className={cx("flex gap-3 p-4 hover:bg-slate-50", !n.read_at && "bg-brand-50/60")}>
                    <span className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", n.read_at ? "bg-slate-200" : "bg-brand-600")} aria-hidden />
                    <span className="min-w-0">
                      <span className={cx("block text-sm text-ink", !n.read_at && "font-semibold")}>{n.title}</span>
                      {n.body ? <span className="block text-sm text-ink-soft">{n.body}</span> : null}
                      <span className="block text-xs text-ink-muted" title={formatDateTime(n.created_at, country)}>
                        {formatRelative(n.created_at)}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Bell} title="Aucune notification">
              Vous serez prévenu ici à chaque nouvelle inscription (commerçant, particulier, livreur).
            </EmptyState>
          )}
        </div>
        <div className="lg:col-span-2">
          <Card title="Recevoir les notifications sur cet appareil">
            <p className="mb-3 text-sm text-ink-soft">
              Pour être prévenu même quand l'application est fermée (comme un message), activez-les sur chaque téléphone et ordinateur que
              vous utilisez. {devices ? `Appareils activés : ${devices}.` : ""}
            </p>
            <PushSettings publicKey={vapidKeys().publicKey} />
            <p className="mt-3 text-xs text-ink-muted">Aucun e-mail ni SMS n'est envoyé : les notifications passent par le navigateur.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
