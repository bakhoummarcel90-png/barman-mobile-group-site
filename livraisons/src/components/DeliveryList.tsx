import Link from "next/link";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import { formatDateTime, formatMoney, formatPhone } from "@/lib/format";
import { paymentMethodLabel, type CountryConfig } from "@/lib/regions";
import type { Role } from "@/lib/constants";
import type { DeliveryView } from "@/lib/types";
import { PaymentBadge, StatusBadge, cx } from "./ui";

function isLate(d: DeliveryView): boolean {
  return (d.status === "a_attribuer" || d.status === "attribuee") && !!d.scheduled_at && d.scheduled_at < new Date().toISOString();
}

export function DeliveryCard({ d, country, role }: { d: DeliveryView; country: CountryConfig; role: Role }) {
  const late = isLate(d);
  return (
    <Link href={`/commandes/${d.id}`} className="card block p-4 transition active:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink-muted">{d.reference}</p>
          <p className="truncate text-base font-semibold text-ink">{d.customer_name}</p>
        </div>
        <StatusBadge status={d.status} />
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        <span className="min-w-0">
          <strong className="font-semibold">{d.neighborhood}</strong> — {d.address}
        </span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className={cx("flex items-center gap-1", late ? "font-semibold text-red-700" : "text-ink-muted")}>
          <Clock className="h-4 w-4" aria-hidden />
          {d.scheduled_at ? formatDateTime(d.scheduled_at, country) : "Sans horaire"}
          {late ? " · en retard" : ""}
        </span>
        <span className="font-semibold tabular-nums text-ink">{formatMoney(d.amount_to_collect, country)}</span>
        <span className="text-ink-muted">{paymentMethodLabel(country, d.expected_payment_method)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
        <span className="truncate">
          {role !== "merchant" ? d.merchant_name : null}
          {role !== "merchant" && role !== "courier" ? " · " : null}
          {role !== "courier" ? d.courier_name ?? "Aucun livreur" : null}
        </span>
        {d.status === "livree" ? <PaymentBadge status={d.payment_status} /> : <ChevronRight className="h-4 w-4" aria-hidden />}
      </div>
    </Link>
  );
}

export function DeliveryList({
  rows,
  country,
  role,
}: {
  rows: DeliveryView[];
  country: CountryConfig;
  role: Role;
}) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rows.map((d) => (
          <DeliveryCard key={d.id} d={d} country={country} role={role} />
        ))}
      </div>
      <div className="card hidden overflow-x-auto md:block">
        <table className="table-base">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Quartier</th>
              {role !== "merchant" ? <th>Commerçant</th> : null}
              {role !== "courier" ? <th>Livreur</th> : null}
              <th>Prévue</th>
              <th className="text-right">À collecter</th>
              <th>Statut</th>
              <th>Paiement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/commandes/${d.id}`} className="link whitespace-nowrap">
                    {d.reference}
                  </Link>
                </td>
                <td>
                  <div className="font-medium text-ink">{d.customer_name}</div>
                  <div className="whitespace-nowrap text-xs text-ink-muted">{formatPhone(d.customer_phone, country)}</div>
                </td>
                <td>{d.neighborhood}</td>
                {role !== "merchant" ? <td>{d.merchant_name}</td> : null}
                {role !== "courier" ? <td>{d.courier_name ?? <span className="text-ink-muted">—</span>}</td> : null}
                <td className={cx("whitespace-nowrap", isLate(d) && "font-semibold text-red-700")}>
                  {d.scheduled_at ? formatDateTime(d.scheduled_at, country) : "—"}
                </td>
                <td className="whitespace-nowrap text-right tabular-nums">
                  {formatMoney(d.amount_to_collect, country)}
                  <div className="text-xs text-ink-muted">{paymentMethodLabel(country, d.expected_payment_method)}</div>
                </td>
                <td>
                  <StatusBadge status={d.status} />
                </td>
                <td>{d.status === "livree" ? <PaymentBadge status={d.payment_status} /> : <span className="text-ink-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
