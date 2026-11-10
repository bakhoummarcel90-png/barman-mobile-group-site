import type { Metadata } from "next";
import Link from "next/link";
import { Download, Package, Plus, Search } from "lucide-react";
import { EmptyState, PageHeader, ShipmentBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { SHIPMENT_STATUS_LABELS, TRANSPORT_MODES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { SHIPPING_COUNTRIES, shippingCountryName } from "@/lib/regions";
import { DIRECTION_LABELS, directionOf, listShipments, parseShipmentFilters } from "@/lib/shipments";

export const metadata: Metadata = { title: "Colis internationaux" };

export default async function ShipmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  const sp = await searchParams;
  const f = parseShipmentFilters(sp);
  const { rows, total } = listShipments(user, f, { limit: 100 });
  const qs = new URLSearchParams(
    Object.entries({ statut: f.status ?? "", sens: f.direction ?? "", pays: f.country ?? "", q: f.q }).filter(([, v]) => v),
  ).toString();
  const filtered = !!qs;

  return (
    <>
      <PageHeader
        title="Colis internationaux"
        description={`${total} colis · Europe, Chine, États-Unis… ↔ Afrique`}
        actions={
          <>
            <Link href="/suivi" className="btn-secondary" target="_blank">
              <Search className="h-4 w-4" aria-hidden /> Page de suivi client
            </Link>
            <a href={`/api/export/colis${qs ? `?${qs}` : ""}`} className="btn-secondary">
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
            <Link href="/colis/nouveau" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden /> Nouveau colis
            </Link>
          </>
        }
      />

      <form method="get" className="card mb-4 grid grid-cols-2 gap-2 p-3 sm:p-4 md:grid-cols-5">
        <select name="statut" defaultValue={f.status ?? ""} className="input" aria-label="Étape">
          <option value="">Toutes les étapes</option>
          <option value="actifs">En cours (non livrés)</option>
          {Object.entries(SHIPMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="sens" defaultValue={f.direction ?? ""} className="input" aria-label="Sens">
          <option value="">Tous les sens</option>
          {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="pays" defaultValue={f.country ?? ""} className="input" aria-label="Pays">
          <option value="">Tous les pays</option>
          {Object.entries(SHIPPING_COUNTRIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input name="q" defaultValue={f.q} placeholder="N° de suivi, nom, contenu" className="input col-span-2 md:col-span-1" />
        <div className="col-span-2 flex gap-2 md:col-span-1">
          <button type="submit" className="btn-primary flex-1">
            Filtrer
          </button>
          {filtered ? (
            <Link href="/colis" className="btn-ghost">
              Effacer
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((s) => (
              <Link key={s.id} href={`/colis/${s.id}`} className="card block p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-ink-muted">{s.tracking_number}</p>
                  <ShipmentBadge status={s.status} />
                </div>
                <p className="mt-1 truncate font-semibold text-ink">{s.recipient_name}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {shippingCountryName(s.origin_country)} → {shippingCountryName(s.destination_country)} · {TRANSPORT_MODES[s.transport_mode]}
                </p>
                <p className="mt-1 truncate text-xs text-ink-muted">{s.description}</p>
              </Link>
            ))}
          </div>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>N° de suivi</th>
                  <th>Trajet</th>
                  <th>Destinataire</th>
                  <th>Contenu</th>
                  {user.role === "admin" ? <th>Client</th> : null}
                  <th>Arrivée estimée</th>
                  <th>Étape</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td>
                      <Link href={`/colis/${s.id}`} className="link font-mono">
                        {s.tracking_number}
                      </Link>
                      <div className="text-xs text-ink-muted">{DIRECTION_LABELS[directionOf(s, country.code)]}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      {shippingCountryName(s.origin_country)} → {shippingCountryName(s.destination_country)}
                      <div className="text-xs text-ink-muted">{TRANSPORT_MODES[s.transport_mode]}</div>
                    </td>
                    <td>{s.recipient_name}</td>
                    <td className="max-w-[16rem] truncate">{s.description}</td>
                    {user.role === "admin" ? <td>{s.merchant_name ?? <span className="text-ink-muted">Particulier</span>}</td> : null}
                    <td className="whitespace-nowrap">{s.estimated_arrival ? formatDate(`${s.estimated_arrival}T12:00:00Z`, country) : "—"}</td>
                    <td>
                      <ShipmentBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState icon={Package} title={filtered ? "Aucun colis ne correspond aux filtres" : "Aucun colis international"}>
          {filtered ? "Modifiez ou effacez les filtres." : "Enregistrez un colis venant d'Europe, de Chine, des États-Unis… ou partant vers l'étranger."}
        </EmptyState>
      )}
    </>
  );
}
