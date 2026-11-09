"use client";

import { useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { PERIODS, type DeliveryFilters } from "@/lib/filters";

interface Option {
  id: number;
  name: string;
  active: number;
}

/** Filtres en GET (?periode=…) : chaque changement recharge la page filtrée. */
export function FilterBar({
  filters,
  merchants,
  couriers,
  showStatus = true,
  showPayment = false,
  showSearch = true,
  basePath,
}: {
  filters: DeliveryFilters;
  merchants: Option[];
  couriers: Option[];
  showStatus?: boolean;
  showPayment?: boolean;
  showSearch?: boolean;
  basePath: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [period, setPeriod] = useState<string>(filters.period);
  const submit = () => form.current?.requestSubmit();
  const active = [filters.period !== "all", filters.merchantId, filters.courierId, filters.status, filters.payment, filters.q].filter(Boolean).length;

  return (
    <form ref={form} method="get" action={basePath} className="card mb-4 p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtres
        {active ? <span className="rounded-full bg-brand-50 px-2 text-xs text-brand-700">{active} actif(s)</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Période</span>
          <select
            name="periode"
            className="input"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              if (e.target.value !== "custom") setTimeout(submit);
            }}
          >
            {Object.entries(PERIODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {period === "custom" ? (
          <>
            <label>
              <span className="text-xs text-ink-muted">Du</span>
              <input type="date" name="du" defaultValue={filters.from} className="input" />
            </label>
            <label>
              <span className="text-xs text-ink-muted">Au</span>
              <input type="date" name="au" defaultValue={filters.to} className="input" />
            </label>
          </>
        ) : null}
        {merchants.length ? (
          <label>
            <span className="sr-only">Commerçant</span>
            <select name="commercant" className="input" defaultValue={filters.merchantId ?? ""} onChange={submit}>
              <option value="">Tous les commerçants</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.active ? "" : " (désactivé)"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {couriers.length ? (
          <label>
            <span className="sr-only">Livreur</span>
            <select name="livreur" className="input" defaultValue={filters.courierId ?? ""} onChange={submit}>
              <option value="">Tous les livreurs</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.active ? "" : " (désactivé)"}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showStatus ? (
          <label>
            <span className="sr-only">Statut</span>
            <select name="statut" className="input" defaultValue={filters.status ?? ""} onChange={submit}>
              <option value="">Tous les statuts</option>
              <option value="actives">En attente ou en cours</option>
              <option value="terminees">Terminées</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showPayment ? (
          <label>
            <span className="sr-only">Paiement</span>
            <select name="paiement" className="input" defaultValue={filters.payment ?? ""} onChange={submit}>
              <option value="">Tous les paiements</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showSearch ? (
          <label className="col-span-2 md:col-span-1">
            <span className="sr-only">Recherche</span>
            <input type="search" name="q" defaultValue={filters.q} placeholder="N°, client, téléphone, quartier" className="input" />
          </label>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2">
        <button type="submit" className="btn-primary btn-sm">
          Appliquer
        </button>
        {active ? (
          <a href={basePath} className="btn-ghost btn-sm">
            Réinitialiser
          </a>
        ) : null}
      </div>
    </form>
  );
}
