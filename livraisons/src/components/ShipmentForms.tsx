"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveShipmentAction, shipmentStatusAction } from "@/app/actions";
import { SHIPMENT_STATUS_LABELS, SHIPMENT_STATUSES, TRANSPORT_MODES, type ShipmentStatus } from "@/lib/constants";
import { Field, FormMessage, inputProps, SubmitButton, useFormKey } from "./forms";

interface Option {
  id: number;
  name: string;
  active: number;
}

export function ShipmentForm({
  id,
  defaults = {},
  merchants,
  isAdmin,
  countries,
  currencies,
  currencyLabel,
}: {
  id?: number;
  defaults?: Record<string, string>;
  merchants: Option[];
  isAdmin: boolean;
  countries: [string, string][];
  currencies: string[];
  currencyLabel: string;
}) {
  const [state, action] = useActionState(saveShipmentAction, {});
  const formKey = useFormKey(state);
  const p = (n: string) => inputProps(n, state, defaults);
  const e = (n: string) => state.errors?.[n];
  const countrySelect = (name: string) => (
    <select {...p(name)}>
      <option value="">Choisir…</option>
      {countries.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <form key={formKey} action={action} className="space-y-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormMessage state={state} />

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Trajet et transport</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pays de départ" name="origin_country" error={e("origin_country")} required>
            {countrySelect("origin_country")}
          </Field>
          <Field label="Ville de départ" name="origin_city" error={e("origin_city")}>
            <input {...p("origin_city")} placeholder="ex. Paris, Guangzhou, New York" />
          </Field>
          <Field label="Pays d'arrivée" name="destination_country" error={e("destination_country")} required>
            {countrySelect("destination_country")}
          </Field>
          <Field label="Ville d'arrivée" name="destination_city" error={e("destination_city")}>
            <input {...p("destination_city")} placeholder="ex. Dakar" />
          </Field>
          <Field label="Mode de transport" name="transport_mode" error={e("transport_mode")} required>
            <select {...p("transport_mode")}>
              <option value="">Choisir…</option>
              {Object.entries(TRANSPORT_MODES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'arrivée estimée" name="estimated_arrival" error={e("estimated_arrival")}>
            <input {...p("estimated_arrival")} type="date" />
          </Field>
          <Field label="Transporteur / transitaire" name="carrier" error={e("carrier")} hint="DHL, FedEx, UPS, Air France Cargo, votre transitaire…">
            <input {...p("carrier")} />
          </Field>
          <Field label="N° de suivi du transporteur" name="carrier_tracking" error={e("carrier_tracking")} hint="Lettre de transport (AWB), connaissement, n° DHL…">
            <input {...p("carrier_tracking")} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Expéditeur et destinataire</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin ? (
            <Field label="Client commerçant" name="merchant_id" error={e("merchant_id")} hint="Laissez vide pour un particulier.">
              <select {...p("merchant_id")}>
                <option value="">Particulier / aucun commerçant</option>
                {merchants
                  .filter((m) => m.active || String(m.id) === defaults.merchant_id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </Field>
          ) : null}
          <Field label="Votre référence" name="client_reference" error={e("client_reference")} hint="N° de commande, facture…">
            <input {...p("client_reference")} maxLength={60} />
          </Field>
          <Field label="Expéditeur" name="sender_name" error={e("sender_name")} required>
            <input {...p("sender_name")} placeholder="Nom ou société" />
          </Field>
          <Field label="Téléphone de l'expéditeur" name="sender_phone" error={e("sender_phone")} hint="Avec l'indicatif du pays : +33…, +86…, +1…">
            <input {...p("sender_phone")} type="tel" inputMode="tel" />
          </Field>
          <Field label="Destinataire" name="recipient_name" error={e("recipient_name")} required>
            <input {...p("recipient_name")} />
          </Field>
          <Field label="Téléphone du destinataire" name="recipient_phone" error={e("recipient_phone")} required>
            <input {...p("recipient_phone")} type="tel" inputMode="tel" />
          </Field>
          <Field label="Adresse de livraison" name="recipient_address" error={e("recipient_address")} className="sm:col-span-2">
            <input {...p("recipient_address")} placeholder="Quartier, rue, repères" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Contenu et tarif</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Contenu" name="description" error={e("description")} required className="sm:col-span-3">
            <input {...p("description")} placeholder="ex. Vêtements, pièces détachées, téléphone…" />
          </Field>
          <Field label="Nombre de colis" name="pieces" error={e("pieces")} required>
            <input {...p("pieces")} inputMode="numeric" />
          </Field>
          <Field label="Poids total (kg)" name="weight_kg" error={e("weight_kg")}>
            <input {...p("weight_kg")} inputMode="decimal" placeholder="ex. 2,5" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valeur déclarée" name="declared_value" error={e("declared_value")}>
              <input {...p("declared_value")} inputMode="numeric" />
            </Field>
            <Field label="Devise" name="declared_currency" error={e("declared_currency")}>
              <select {...p("declared_currency")}>
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={`Frais d'envoi (${currencyLabel})`} name="shipping_fee" error={e("shipping_fee")} required>
            <input {...p("shipping_fee")} inputMode="numeric" placeholder="0" />
          </Field>
          <Field label="Paiement des frais" name="fee_paid" required>
            <select {...p("fee_paid")}>
              <option value="0">À payer à la livraison</option>
              <option value="1">Déjà payés</option>
            </select>
          </Field>
          <Field label="Notes internes" name="notes" error={e("notes")} hint="Jamais visibles sur la page de suivi publique." className="sm:col-span-3">
            <textarea {...p("notes")} rows={2} />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={id ? `/colis/${id}` : "/colis"} className="btn-secondary">
          Annuler
        </Link>
        <SubmitButton className="btn-primary sm:min-w-48">{id ? "Enregistrer les modifications" : "Enregistrer le colis"}</SubmitButton>
      </div>
    </form>
  );
}

/** Nouvelle étape de suivi (administrateur). */
export function ShipmentStatusForm({ id, current }: { id: number; current: ShipmentStatus }) {
  const [state, action] = useActionState(shipmentStatusAction, {});
  const formKey = useFormKey(state);
  const next = SHIPMENT_STATUSES[Math.min(SHIPMENT_STATUSES.indexOf(current) + 1, SHIPMENT_STATUSES.indexOf("livre"))];
  return (
    <form key={formKey} action={action} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />
      <Field label="Nouvelle étape" name="status" error={state.errors?.status} required>
        <select {...inputProps("status", state, { status: current === "incident" ? "en_transit" : next })}>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SHIPMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Lieu" name="location" hint="Visible par le client, ex. « Aéroport CDG, Paris » ou « Port de Dakar ».">
        <input {...inputProps("location", state)} maxLength={120} />
      </Field>
      <Field label="Note interne" name="note" hint="Obligatoire pour un incident. Non visible par le client.">
        <textarea {...inputProps("note", state)} rows={2} maxLength={500} />
      </Field>
      <SubmitButton>Enregistrer l'étape</SubmitButton>
    </form>
  );
}
