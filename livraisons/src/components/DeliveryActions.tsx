"use client";

import { useState } from "react";
import { Ban, Bike, CheckCircle2, Undo2, XCircle } from "lucide-react";
import { assignAction, noteAction, paymentAction, statusAction } from "@/app/actions";
import { canTransition, FAILURE_REASONS, PAYMENT_STATUS_LABELS, type DeliveryStatus, type PaymentStatus, type Role } from "@/lib/constants";
import type { PaymentMethodConfig } from "@/lib/regions";
import { ActionForm, ConfirmSubmit, Field, inputProps, PhotoInput, SubmitButton } from "./forms";
import { cx } from "./ui";

interface D {
  id: number;
  status: DeliveryStatus;
  courier_id: number | null;
  amount_to_collect: number;
  expected_payment_method: string;
  collected_amount: number | null;
  collected_payment_method: string | null;
  payment_status: PaymentStatus;
  payment_note: string | null;
  settled: boolean;
}

interface Common {
  d: D;
  role: Role;
  paymentMethods: PaymentMethodConfig[];
  currencyLabel: string;
  amountLabel: string;
}

/** Démarrer / livrer / échouer / retour : interface du livreur (et de l'administrateur). */
export function CourierActions({ d, role, paymentMethods, currencyLabel, amountLabel }: Common) {
  const [tab, setTab] = useState<"livree" | "echec">("livree");
  const can = (to: DeliveryStatus) => canTransition(d.status, to, role);

  if (d.status === "attribuee" && can("en_cours")) {
    return (
      <ActionForm action={statusAction} hidden={{ id: d.id, to: "en_cours" }}>
        <ConfirmSubmit
          label="Démarrer la course"
          icon={<Bike className="h-5 w-5" aria-hidden />}
          className="btn-primary btn-lg w-full"
          title="Démarrer la course ?"
          message="Le commerçant et l'entreprise verront que la livraison est en route."
          confirmLabel="Oui, je pars"
        />
      </ActionForm>
    );
  }

  if (d.status === "en_cours" && (can("livree") || can("echec"))) {
    return (
      <div>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "livree"}
            onClick={() => setTab("livree")}
            className={cx("btn", tab === "livree" ? "bg-white text-emerald-700 shadow" : "text-ink-muted")}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Livrée
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "echec"}
            onClick={() => setTab("echec")}
            className={cx("btn", tab === "echec" ? "bg-white text-red-700 shadow" : "text-ink-muted")}
          >
            <XCircle className="h-5 w-5" aria-hidden /> Échec
          </button>
        </div>

        {tab === "livree" ? (
          <ActionForm action={statusAction} hidden={{ id: d.id, to: "livree" }} resetOnSuccess>
            {(state) => (
              <>
                <p className="text-sm text-ink-soft">
                  Montant attendu : <strong>{amountLabel}</strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Montant encaissé (${currencyLabel})`} name="collected_amount" error={state.errors?.collected_amount} required>
                    <input {...inputProps("collected_amount", state, { collected_amount: String(d.amount_to_collect) })} inputMode="numeric" />
                  </Field>
                  <Field label="Payé par" name="collected_method" required>
                    <select {...inputProps("collected_method", state, { collected_method: d.expected_payment_method })}>
                      {paymentMethods.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Note" name="note">
                  <textarea {...inputProps("note", state)} rows={2} placeholder="ex. Remis au gardien, client a payé la monnaie…" />
                </Field>
                <PhotoInput />
                <ConfirmSubmit
                  label="Confirmer la livraison"
                  icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
                  className="btn-primary btn-lg w-full"
                  title="Confirmer la livraison ?"
                  message="Vérifiez le montant encaissé : il sera contrôlé par l'entreprise de livraison."
                  confirmLabel="Oui, c'est livré"
                />
              </>
            )}
          </ActionForm>
        ) : (
          <ActionForm action={statusAction} hidden={{ id: d.id, to: "echec" }}>
            {(state) => (
              <>
                <Field label="Raison de l'échec" name="failure_reason" error={state.errors?.failure_reason} required>
                  <select {...inputProps("failure_reason", state)}>
                    <option value="">Choisir…</option>
                    {FAILURE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Précisions" name="failure_detail">
                  <textarea {...inputProps("failure_detail", state)} rows={2} placeholder="ex. Appelé 3 fois à 14 h 10, pas de réponse" />
                </Field>
                <PhotoInput label="Photo (devant l'adresse, colis…)" />
                <ConfirmSubmit
                  label="Signaler l'échec"
                  icon={<XCircle className="h-5 w-5" aria-hidden />}
                  className="btn-danger btn-lg w-full"
                  tone="danger"
                  title="Signaler un échec de livraison ?"
                  message="Le colis devra être rapporté au commerçant ou livré lors d'une nouvelle tentative."
                  confirmLabel="Signaler l'échec"
                />
              </>
            )}
          </ActionForm>
        )}
      </div>
    );
  }

  if (d.status === "echec" && can("retour_commercant")) {
    return (
      <ActionForm action={statusAction} hidden={{ id: d.id, to: "retour_commercant" }}>
        <p className="text-sm text-ink-soft">Une fois le colis rapporté à la boutique, enregistrez le retour.</p>
        <Field label="Note" name="note-retour">
          <textarea name="note" id="note-retour" className="input" rows={2} placeholder="ex. Remis à Sokhna à la boutique" />
        </Field>
        <ConfirmSubmit
          label="Colis rendu au commerçant"
          icon={<Undo2 className="h-5 w-5" aria-hidden />}
          className="btn-secondary btn-lg w-full"
          title="Confirmer le retour au commerçant ?"
          message="La livraison sera clôturée."
        />
      </ActionForm>
    );
  }
  return null;
}

/** Attribution du livreur (administrateur). */
export function AssignForm({
  d,
  couriers,
  from,
}: {
  d: Pick<D, "id" | "status" | "courier_id">;
  couriers: { id: number; name: string; active: number }[];
  from?: string;
}) {
  const active = couriers.filter((c) => c.active);
  return (
    <ActionForm action={assignAction} hidden={from ? { id: d.id, from } : { id: d.id }}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Livreur</span>
          <select name="courier_id" className="input" defaultValue={d.courier_id ?? ""}>
            <option value="">— Aucun (à attribuer) —</option>
            {active.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton>{d.status === "echec" ? "Nouvelle tentative" : d.courier_id ? "Changer" : "Attribuer"}</SubmitButton>
      </div>
      {!active.length ? <p className="text-sm text-amber-700">Aucun livreur actif : ajoutez-en un dans la page Livreurs.</p> : null}
    </ActionForm>
  );
}

/** Annulation (administrateur, ou commerçant avant le départ du livreur). */
export function CancelForm({ d }: { d: D }) {
  return (
    <ActionForm action={statusAction} hidden={{ id: d.id, to: "annulee" }}>
      <Field label="Motif de l'annulation" name="note-annulation">
        <input id="note-annulation" name="note" className="input" placeholder="ex. Client a annulé par téléphone" />
      </Field>
      <ConfirmSubmit
        label="Annuler la commande"
        icon={<Ban className="h-4 w-4" aria-hidden />}
        className="btn-secondary w-full text-red-700"
        tone="danger"
        title="Annuler cette commande ?"
        message="Cette action est définitive : la commande ne pourra plus être livrée ni modifiée."
        confirmLabel="Oui, annuler"
      />
    </ActionForm>
  );
}

/** Vérification manuelle de l'encaissement (administrateur). */
export function PaymentReviewForm({ d, paymentMethods, currencyLabel }: Omit<Common, "role" | "amountLabel">) {
  if (d.settled)
    return <p className="text-sm text-ink-muted">Ce montant fait partie d'une remise ou d'un reversement enregistré : il n'est plus modifiable.</p>;
  return (
    <ActionForm action={paymentAction} hidden={{ id: d.id }}>
      {(state) => (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={`Montant collecté (${currencyLabel})`} name="collected_amount" error={state.errors?.collected_amount} required>
              <input {...inputProps("collected_amount", state, { collected_amount: String(d.collected_amount ?? 0) })} inputMode="numeric" />
            </Field>
            <Field label="Moyen de paiement" name="collected_method">
              <select {...inputProps("collected_method", state, { collected_method: d.collected_payment_method ?? d.expected_payment_method })}>
                {paymentMethods.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Statut du paiement" name="payment_status" error={state.errors?.payment_status} required>
              <select {...inputProps("payment_status", state, { payment_status: d.payment_status === "a_verifier" ? "confirme" : d.payment_status })}>
                {(["confirme", "ecart", "non_encaisse"] as const).map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Commentaire" name="payment_note" hint="Obligatoire en cas d'écart : montant manquant, explication du livreur, référence de la transaction Wave / Orange Money…">
            <textarea {...inputProps("payment_note", state, { payment_note: d.payment_note ?? "" })} rows={2} />
          </Field>
          <SubmitButton>Enregistrer la vérification</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/** Ajout d'une note ou d'une photo sans changer le statut. */
export function NoteForm({ d }: { d: D }) {
  return (
    <ActionForm action={noteAction} hidden={{ id: d.id }} resetOnSuccess>
      <Field label="Note" name="note-add">
        <textarea id="note-add" name="note" className="input" rows={2} placeholder="Information utile pour l'équipe" />
      </Field>
      <PhotoInput name="photo" id="photo-add" label="Photo" />
      <SubmitButton className="btn-secondary">Ajouter</SubmitButton>
    </ActionForm>
  );
}
