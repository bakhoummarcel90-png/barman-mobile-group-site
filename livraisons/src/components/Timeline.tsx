import Link from "next/link";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { CountryConfig } from "@/lib/regions";
import type { EventView } from "@/lib/types";
import { StatusBadge } from "./ui";

const KIND_LABELS: Record<string, string> = {
  created: "Création",
  edited: "Modification",
  assigned: "Attribution",
  payment: "Encaissement",
  note: "Note",
  photo: "Photo",
  settlement: "Reversement",
  account: "Compte",
};

export function Timeline({ events, country, showDelivery = false }: { events: EventView[]; country: CountryConfig; showDelivery?: boolean }) {
  if (!events.length) return <p className="text-sm text-ink-muted">Aucun événement pour le moment.</p>;
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-200" aria-hidden />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {e.kind === "status" && e.to_status ? (
              <StatusBadge status={e.to_status} />
            ) : (
              <span className="font-semibold text-ink">{KIND_LABELS[e.kind] ?? e.kind}</span>
            )}
            {showDelivery && e.delivery_id ? (
              <Link href={`/commandes/${e.delivery_id}`} className="link text-xs">
                {e.delivery_reference}
              </Link>
            ) : null}
          </div>
          {e.message ? <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{e.message}</p> : null}
          {e.kind === "status" && e.from_status && e.to_status ? (
            <p className="sr-only">
              De {STATUS_LABELS[e.from_status]} à {STATUS_LABELS[e.to_status]}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatDateTime(e.created_at, country)}
            {e.user_name ? ` · ${e.user_name}${e.user_role ? ` (${ROLE_LABELS[e.user_role]})` : ""}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
