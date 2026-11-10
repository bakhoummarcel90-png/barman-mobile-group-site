"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveDeliveryAction } from "@/app/actions";
import type { PaymentMethodConfig } from "@/lib/regions";
import { Field, FormMessage, inputProps, SubmitButton, useFormKey } from "./forms";

interface Option {
  id: number;
  name: string;
  active: number;
}

export function DeliveryForm({
  id,
  defaults = {},
  merchants,
  couriers,
  paymentMethods,
  neighborhoods,
  currencyLabel,
  isAdmin,
  courierLocked,
  phoneExample,
  city,
  shipmentId,
}: {
  id?: number;
  defaults?: Record<string, string>;
  merchants: Option[];
  couriers: Option[];
  paymentMethods: PaymentMethodConfig[];
  neighborhoods: string[];
  currencyLabel: string;
  isAdmin: boolean;
  /** La course a démarré : le livreur ne peut plus être changé depuis ce formulaire. */
  courierLocked?: boolean;
  phoneExample: string;
  city: string;
  /** Livraison locale d'un colis international. */
  shipmentId?: number;
}) {
  const [state, action] = useActionState(saveDeliveryAction, {});
  const formKey = useFormKey(state);
  const [merchantChoice, setMerchantChoice] = useState(state.values?.merchant_id ?? defaults.merchant_id ?? "");
  const p = (name: string) => inputProps(name, state, defaults);
  const e = (name: string) => state.errors?.[name];

  return (
    <form key={formKey} action={action} className="space-y-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      {shipmentId ? <input type="hidden" name="shipment_id" value={shipmentId} /> : null}
      <FormMessage state={state} />

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Commande</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numéro de commande" name="reference" error={e("reference")} hint="Laissez vide pour un numéro automatique (LIV-AAMMJJ-001).">
            <input {...p("reference")} placeholder="ex. CMD-1024" maxLength={40} />
          </Field>
          {isAdmin ? (
            <div className="space-y-2">
              <Field
                label="Commerçant"
                name="merchant_id"
                error={e("merchant_id")}
                hint="Pas dans la liste ? Choisissez « + Nouveau commerçant » et tapez son nom."
                required
              >
                <select {...p("merchant_id")} onChange={(ev) => setMerchantChoice(ev.target.value)}>
                  <option value="">Choisir…</option>
                  <option value="new">+ Nouveau commerçant (taper le nom)</option>
                  {merchants
                    .filter((m) => m.active || String(m.id) === defaults.merchant_id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </Field>
              {merchantChoice === "new" ? (
                <Field label="Nom du nouveau commerçant" name="new_merchant_name" error={e("new_merchant_name")} hint="Il sera ajouté à la page Commerçants, où vous pourrez compléter sa fiche." required>
                  <input {...p("new_merchant_name")} placeholder="ex. Boutique Marcel" maxLength={80} />
                </Field>
              ) : null}
            </div>
          ) : null}
          <Field label="Date et heure prévues" name="scheduled_at" error={e("scheduled_at")} hint={`Heure locale (${city}).`}>
            <input {...p("scheduled_at")} type="datetime-local" />
          </Field>
          {isAdmin ? (
            <Field
              label="Livreur"
              name="courier_id"
              error={e("courier_id")}
              hint={courierLocked ? "La course a démarré : le livreur ne peut plus être changé." : "Laissez vide pour attribuer plus tard."}
            >
              <select {...p("courier_id")} disabled={courierLocked}>
                <option value="">À attribuer plus tard</option>
                {couriers
                  .filter((c) => c.active || String(c.id) === defaults.courier_id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              {courierLocked ? <input type="hidden" name="courier_id" value={defaults.courier_id ?? ""} /> : null}
            </Field>
          ) : null}
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Client et adresse</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du client" name="customer_name" error={e("customer_name")} required>
            <input {...p("customer_name")} autoComplete="off" />
          </Field>
          <Field label="Téléphone du client" name="customer_phone" error={e("customer_phone")} required>
            <input {...p("customer_phone")} type="tel" inputMode="tel" placeholder={phoneExample} />
          </Field>
          <Field label="Adresse complète" name="address" error={e("address")} required className="sm:col-span-2">
            <input {...p("address")} placeholder="Rue, villa, immeuble, étage…" />
          </Field>
          <Field label="Quartier" name="neighborhood" error={e("neighborhood")} required>
            <input {...p("neighborhood")} list="quartiers" placeholder="ex. Sacré-Cœur" />
            <datalist id="quartiers">
              {neighborhoods.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label="Indications d'accès" name="access_notes" error={e("access_notes")} className="sm:col-span-2">
            <textarea {...p("access_notes")} rows={2} placeholder="Repères, portail, interphone, horaires…" />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Paiement</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Montant à collecter (${currencyLabel})`} name="amount_to_collect" error={e("amount_to_collect")} hint="0 si la commande est déjà payée." required>
            <input {...p("amount_to_collect")} inputMode="numeric" placeholder="15000" />
          </Field>
          <Field label="Mode de paiement attendu" name="expected_payment_method" error={e("expected_payment_method")} required>
            <select {...p("expected_payment_method")}>
              <option value="">Choisir…</option>
              {paymentMethods.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Frais de livraison (${currencyLabel})`} name="delivery_fee" error={e("delivery_fee")} hint="Déduits du montant reversé au commerçant." required>
            <input {...p("delivery_fee")} inputMode="numeric" placeholder="2000" />
          </Field>
          <Field label="Notes" name="notes" error={e("notes")} className="sm:col-span-3">
            <textarea {...p("notes")} rows={2} placeholder="Contenu du colis, fragilité, consignes…" />
          </Field>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={id ? `/commandes/${id}` : "/commandes"} className="btn-secondary">
          Annuler
        </Link>
        <SubmitButton className="btn-primary sm:min-w-48">{id ? "Enregistrer les modifications" : "Créer la commande"}</SubmitButton>
      </div>
    </form>
  );
}
