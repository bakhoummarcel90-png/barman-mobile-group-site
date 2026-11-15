"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import {
  bookingDecisionAction,
  bookingUpdateAction,
  bookTripAction,
  declarePaymentAction,
  gpApplicationAction,
  gpSettingsAction,
  receiveBookingAction,
  refuseBookingAction,
  reportAction,
  reportDecisionAction,
  saveTripAction,
  tripStatusAction,
} from "@/app/actions";
import type { TripStatus } from "@/lib/gp";
import { ActionForm, ConfirmSubmit, Field, FormMessage, inputProps, PhotoInput, SubmitButton, useFormKey } from "./forms";

interface Opt {
  code: string;
  name: string;
}

/* ---------- Voyage (GP) ---------- */

export function TripForm({
  id,
  defaults = {},
  countries,
  today,
}: {
  id?: number;
  defaults?: Record<string, string>;
  countries: Opt[];
  today: string;
}) {
  const [state, action] = useActionState(saveTripAction, {});
  const formKey = useFormKey(state);
  const p = (n: string) => inputProps(n, state, defaults);
  const e = (n: string) => state.errors?.[n];
  const countrySelect = (name: string) => (
    <select {...p(name)}>
      <option value="">Choisir…</option>
      {countries.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
  return (
    <form key={formKey} action={action} className="space-y-5" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormMessage state={state} />
      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Trajet</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pays de départ" name="origin_country" error={e("origin_country")} required>
            {countrySelect("origin_country")}
          </Field>
          <Field label="Ville de départ" name="origin_city" error={e("origin_city")} required>
            <input {...p("origin_city")} placeholder="ex. Dakar" />
          </Field>
          <Field label="Pays d'arrivée" name="destination_country" error={e("destination_country")} required>
            {countrySelect("destination_country")}
          </Field>
          <Field label="Ville d'arrivée" name="destination_city" error={e("destination_city")} required>
            <input {...p("destination_city")} placeholder="ex. Paris" />
          </Field>
          <Field label="Date de départ" name="departure_date" error={e("departure_date")} required>
            <input {...p("departure_date")} type="date" min={today} />
          </Field>
          <Field label="Date d'arrivée" name="arrival_date" error={e("arrival_date")}>
            <input {...p("arrival_date")} type="date" min={today} />
          </Field>
        </div>
      </section>
      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Kilos et prix</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kilos disponibles" name="capacity_kg" error={e("capacity_kg")} required>
            <input {...p("capacity_kg")} inputMode="decimal" placeholder="ex. 23" />
          </Field>
          <Field label="Prix d'un kilo" name="price_per_kg" error={e("price_per_kg")} required>
            <input {...p("price_per_kg")} inputMode="numeric" placeholder="ex. 7000" />
          </Field>
          <Field label="Devise" name="currency" error={e("currency")} required>
            <select {...p("currency")} defaultValue={state.values?.currency ?? defaults.currency ?? "XOF"}>
              <option value="XOF">FCFA</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </Field>
        </div>
      </section>
      <section className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-semibold text-ink">Dépôt des colis</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu de dépôt" name="dropoff_place" error={e("dropoff_place")} hint="Visible par les expéditeurs dont la réservation est confirmée.">
            <input {...p("dropoff_place")} placeholder="ex. Liberté 6, près de la station" />
          </Field>
          <Field label="Dernier jour de dépôt" name="deadline_date" error={e("deadline_date")}>
            <input {...p("deadline_date")} type="date" min={today} />
          </Field>
          <Field label="Informations" name="notes" error={e("notes")} className="sm:col-span-2">
            <textarea {...p("notes")} rows={3} placeholder="Objets acceptés ou refusés, horaires de dépôt, livraison à domicile à l'arrivée…" />
          </Field>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={id ? `/gp/voyages/${id}` : "/gp"} className="btn-secondary">
          Annuler
        </Link>
        <SubmitButton className="btn-primary sm:min-w-48">{id ? "Enregistrer les modifications" : "Publier le voyage"}</SubmitButton>
      </div>
    </form>
  );
}

export function TripStatusButtons({ id, status }: { id: number; status: TripStatus }) {
  if (status === "annule") return null;
  return (
    <div className="flex flex-wrap gap-2">
      <ActionForm action={tripStatusAction} hidden={{ id, status: status === "ouvert" ? "complet" : "ouvert" }}>
        <SubmitButton className="btn-secondary btn-sm">{status === "ouvert" ? "Marquer complet" : "Rouvrir les réservations"}</SubmitButton>
      </ActionForm>
      <ActionForm action={tripStatusAction} hidden={{ id, status: "annule" }}>
        <ConfirmSubmit
          label="Annuler le voyage"
          className="btn-secondary btn-sm text-red-700"
          tone="danger"
          title="Annuler ce voyage ?"
          message="Les réservations en attente sont annulées et les expéditeurs sont prévenus."
          confirmLabel="Annuler le voyage"
        />
      </ActionForm>
    </div>
  );
}

/* ---------- Réservation (expéditeur) ---------- */

export function BookingForm({
  tripId,
  maxKg,
  fee,
  phoneExample,
  prohibited,
  customsNote,
  currencyLabel,
}: {
  tripId: number;
  maxKg: string;
  fee: string | null;
  phoneExample: string;
  prohibited: string[];
  customsNote: string;
  currencyLabel: string;
}) {
  const [state, action] = useActionState(bookTripAction, {});
  const formKey = useFormKey(state);
  const p = (n: string) => inputProps(n, state);
  const e = (n: string) => state.errors?.[n];
  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="trip_id" value={tripId} />
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Poids du colis (kg)" name="weight_kg" error={e("weight_kg")} hint={`${maxKg} disponibles au plus.`} required>
          <input {...p("weight_kg")} inputMode="decimal" placeholder="ex. 3" />
        </Field>
        <Field label="Contenu" name="description" error={e("description")} required>
          <input {...p("description")} placeholder="ex. Vêtements et chaussures" maxLength={300} />
        </Field>
        <Field label="Nom du destinataire" name="recipient_name" error={e("recipient_name")} required>
          <input {...p("recipient_name")} autoComplete="off" />
        </Field>
        <Field label="Téléphone du destinataire" name="recipient_phone" error={e("recipient_phone")} hint="À l'étranger : avec l'indicatif, ex. +33 6 12 34 56 78." required>
          <input {...p("recipient_phone")} type="tel" inputMode="tel" placeholder={phoneExample} />
        </Field>
        <Field label="Ville du destinataire" name="recipient_city" error={e("recipient_city")}>
          <input {...p("recipient_city")} />
        </Field>
        <Field label={`Valeur approximative du colis (${currencyLabel})`} name="declared_value" error={e("declared_value")} hint="Utile pour la douane et en cas de problème.">
          <input {...p("declared_value")} inputMode="numeric" placeholder="ex. 50000" />
        </Field>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-semibold">Objets interdits</p>
        <ul className="mt-1 list-disc pl-5">
          {prohibited.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs">{customsNote}</p>
      </div>
      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="accept_rules" value="1" className="mt-1 h-4 w-4" defaultChecked={state.values?.accept_rules === "1"} />
        <span>
          Je confirme que mon colis ne contient aucun objet interdit, que j'en connais le contenu, et j'accepte les{" "}
          <Link href="/conditions" className="link" target="_blank">
            conditions d'utilisation
          </Link>
          .
        </span>
      </label>
      {e("accept_rules") ? <p className="-mt-2 text-sm font-medium text-red-700">{e("accept_rules")}</p> : null}
      <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Réservation…">
        {fee ? `Réserver (frais de mise en relation : ${fee})` : "Réserver gratuitement"}
      </SubmitButton>
    </form>
  );
}

export function DeclarePaymentForm({ id, methods }: { id: number; methods: Opt[] }) {
  const [state, action] = useActionState(declarePaymentAction, {});
  const formKey = useFormKey(state);
  const p = (n: string) => inputProps(n, state);
  return (
    <form key={formKey} action={action} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <FormMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Payé par" name="payment_method" required>
          <select {...p("payment_method")}>
            <option value="">Choisir…</option>
            {methods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Référence du transfert" name="payment_reference" hint="Elle figure dans le SMS de confirmation de Wave ou d'Orange Money." required>
          <input {...p("payment_reference")} maxLength={60} autoComplete="off" />
        </Field>
      </div>
      <SubmitButton className="btn-primary w-full sm:w-auto">J'ai payé : envoyer pour vérification</SubmitButton>
    </form>
  );
}

export function BookingButtons({ id, canCancel, canDeliver }: { id: number; canCancel: boolean; canDeliver: boolean }) {
  if (!canCancel && !canDeliver) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {canDeliver ? (
        <ActionForm action={bookingUpdateAction} hidden={{ id, what: "livree" }}>
          <ConfirmSubmit label="Colis remis au destinataire" className="btn-primary btn-sm" title="Le colis a été remis ?" message="Confirmez seulement si le destinataire a bien reçu le colis." confirmLabel="Oui, il est livré" />
        </ActionForm>
      ) : null}
      {canCancel ? (
        <ActionForm action={bookingUpdateAction} hidden={{ id, what: "annuler" }}>
          <ConfirmSubmit label="Annuler la réservation" className="btn-secondary btn-sm text-red-700" tone="danger" title="Annuler cette réservation ?" message="Les kilos réservés sont libérés pour d'autres expéditeurs." confirmLabel="Annuler la réservation" />
        </ActionForm>
      ) : null}
    </div>
  );
}

export function RateGpForm({ id, gpName }: { id: number; gpName: string }) {
  const [state, action] = useActionState(bookingUpdateAction, {});
  const [rating, setRating] = useState(0);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="what" value="noter" />
      <input type="hidden" name="rating" value={rating} />
      <FormMessage state={state} />
      <p className="font-semibold text-ink">Comment s'est passé l'envoi avec {gpName} ?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoile(s)`} aria-pressed={rating >= n}>
            <Star className={`h-9 w-9 ${rating >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
          </button>
        ))}
      </div>
      <textarea name="comment" rows={2} maxLength={300} className="input" placeholder="Un commentaire ? (facultatif)" />
      <SubmitButton className="btn-primary w-full sm:w-auto" disabled={!rating}>
        Envoyer ma note
      </SubmitButton>
    </form>
  );
}

/* ---------- Administration ---------- */

export function PaymentDecision({ id, label, fromList = false }: { id: number; label: string; fromList?: boolean }) {
  const [refusing, setRefusing] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <ActionForm action={bookingDecisionAction} hidden={{ id, decision: "confirmer", from: fromList ? "liste" : "" }}>
          <ConfirmSubmit
            label="Paiement reçu"
            className="btn-primary btn-sm"
            title={`Confirmer ${label} ?`}
            message="Vérifiez d'abord que l'argent est bien arrivé sur votre compte Wave ou Orange Money. Les coordonnées seront ensuite données au GP et à l'expéditeur."
            confirmLabel="Oui, j'ai reçu le paiement"
          />
        </ActionForm>
        <button type="button" className="btn-secondary btn-sm text-red-700" onClick={() => setRefusing((v) => !v)}>
          Paiement non trouvé
        </button>
      </div>
      {refusing ? (
        <ActionForm action={bookingDecisionAction} hidden={{ id, decision: "refuser", from: fromList ? "liste" : "" }}>
          <input name="admin_note" className="input" placeholder="Message pour l'expéditeur, ex. aucun transfert reçu avec cette référence" maxLength={200} />
          <SubmitButton className="btn-secondary btn-sm">Prévenir l'expéditeur</SubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}

export function GpApplication({ userId, name }: { userId: number; name: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionForm action={gpApplicationAction} hidden={{ user_id: userId, decision: "accepter" }}>
        <ConfirmSubmit
          label="Accepter"
          className="btn-primary btn-sm"
          title={`Accepter ${name} comme GP ?`}
          message="Vérifiez son identité (pièce d'identité, billet) avant d'accepter. Il pourra ensuite publier ses voyages."
          confirmLabel="Accepter"
        />
      </ActionForm>
      <ActionForm action={gpApplicationAction} hidden={{ user_id: userId, decision: "refuser" }}>
        <ConfirmSubmit label="Refuser" className="btn-secondary btn-sm text-red-700" tone="danger" title={`Refuser l'inscription de ${name} ?`} message="Le compte est fermé et ses coordonnées sont effacées." confirmLabel="Refuser" />
      </ActionForm>
    </div>
  );
}

export function GpSettingsForm({ fee, paymentInfo, currencyLabel }: { fee: number; paymentInfo: string | null; currencyLabel: string }) {
  return (
    <ActionForm action={gpSettingsAction}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Frais de mise en relation (${currencyLabel})`} name="gp_fee" error={state.errors?.gp_fee} hint="Payés par l'expéditeur à chaque réservation. 0 = gratuit : le bandeau « C'est gratuit » s'affiche partout." required>
            <input {...inputProps("gp_fee", state, { gp_fee: String(fee) })} inputMode="numeric" />
          </Field>
          <Field label="Où payer les frais" name="gp_payment_info" error={state.errors?.gp_payment_info} hint="Affiché à l'expéditeur, ex. « Wave : 77 000 00 00 (Barman Mobile) ».">
            <textarea {...inputProps("gp_payment_info", state, { gp_payment_info: paymentInfo ?? "" })} rows={2} maxLength={500} />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary">Enregistrer</SubmitButton>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

/* ---------- Garde-fous ---------- */

/** Le GP reçoit le colis : il l'ouvre, vérifie le contenu, peut prendre une photo, ou le refuse. */
export function ReceiveForms({ id, description }: { id: number; description: string }) {
  const [refusing, setRefusing] = useState(false);
  return (
    <div className="space-y-4">
      <ActionForm action={receiveBookingAction} hidden={{ id }}>
        {(state) => (
          <>
            <p className="text-sm text-ink-soft">
              Contenu déclaré : <span className="font-semibold text-ink">{description}</span>. Ouvrez le colis devant l'expéditeur et vérifiez qu'il correspond.
            </p>
            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="verified" value="1" className="mt-1 h-4 w-4" defaultChecked={state.values?.verified === "1"} />
              <span>J'ai ouvert le colis et vérifié son contenu : il correspond à la déclaration et ne contient aucun objet interdit.</span>
            </label>
            <PhotoInput name="photo" label="Photo du contenu" />
            <SubmitButton className="btn-primary w-full sm:w-auto">Colis reçu et vérifié</SubmitButton>
          </>
        )}
      </ActionForm>
      <button type="button" className="btn-secondary btn-sm text-red-700" onClick={() => setRefusing((v) => !v)}>
        Refuser ce colis
      </button>
      {refusing ? (
        <ActionForm action={refuseBookingAction} hidden={{ id }}>
          <input name="reason" className="input" maxLength={300} placeholder="Motif, ex. contenu différent de la déclaration, objet interdit…" />
          <ConfirmSubmit
            label="Confirmer le refus"
            className="btn-danger btn-sm"
            tone="danger"
            title="Refuser ce colis ?"
            message="La réservation est annulée ; l'expéditeur et l'entreprise sont prévenus."
            confirmLabel="Refuser le colis"
          />
        </ActionForm>
      ) : null}
    </div>
  );
}

export function ReportForm({ id, reasons }: { id: number; reasons: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" className="btn-ghost btn-sm text-red-700" onClick={() => setOpen(true)}>
        Signaler un problème
      </button>
    );
  return (
    <ActionForm action={reportAction} hidden={{ id }} className="card p-4">
      {(state) => (
        <>
          <p className="font-semibold text-ink">Signaler un problème</p>
          <Field label="Motif" name="reason" error={state.errors?.reason} required>
            <select {...inputProps("reason", state)}>
              <option value="">Choisir…</option>
              {Object.entries(reasons).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Détails" name="details" error={state.errors?.details}>
            <textarea {...inputProps("details", state)} rows={3} maxLength={1000} placeholder="Que s'est-il passé ?" />
          </Field>
          <div className="flex gap-2">
            <SubmitButton className="btn-primary btn-sm">Envoyer le signalement</SubmitButton>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(false)}>
              Annuler
            </button>
          </div>
          <p className="text-xs text-ink-muted">L'entreprise est prévenue tout de suite et peut suspendre un compte.</p>
        </>
      )}
    </ActionForm>
  );
}

export function ReportDecision({ id, gpName, senderName }: { id: number; gpName: string; senderName: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionForm action={reportDecisionAction} hidden={{ id, decision: "traite" }}>
        <SubmitButton className="btn-secondary btn-sm">Marquer comme traité</SubmitButton>
      </ActionForm>
      <ActionForm action={reportDecisionAction} hidden={{ id, decision: "suspendre_gp" }}>
        <ConfirmSubmit
          label="Suspendre le GP"
          className="btn-secondary btn-sm text-red-700"
          tone="danger"
          title={`Suspendre le compte de ${gpName} ?`}
          message="Il ne peut plus se connecter ; ses voyages ouverts et les réservations en attente sont annulés. Vous pourrez le réactiver."
          confirmLabel="Suspendre"
        />
      </ActionForm>
      <ActionForm action={reportDecisionAction} hidden={{ id, decision: "suspendre_expediteur" }}>
        <ConfirmSubmit
          label="Suspendre l'expéditeur"
          className="btn-secondary btn-sm text-red-700"
          tone="danger"
          title={`Suspendre le compte de ${senderName} ?`}
          message="Il ne peut plus se connecter ni réserver. Vous pourrez le réactiver depuis la page Commerçants."
          confirmLabel="Suspendre"
        />
      </ActionForm>
    </div>
  );
}
