"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, Power } from "lucide-react";
import {
  changePasswordAction,
  deleteAccountAction,
  createAdminAction,
  resetPasswordAction,
  saveCourierAction,
  saveMerchantAction,
  toggleMerchantAction,
  toggleUserAction,
} from "@/app/actions";
import type { PaymentMethodConfig } from "@/lib/regions";
import type { FormState } from "@/lib/validation";
import { ActionForm, ConfirmSubmit, Field, FormMessage, inputProps, SubmitButton, useFormKey } from "./forms";
import { Alert } from "./ui";

/** Identifiants à transmettre, affichés une seule fois après création. */
function Credentials({ state, profileHref }: { state: FormState; profileHref?: string }) {
  if (!state.ok || !state.data?.password) return null;
  return (
    <div className="space-y-3">
      <Alert tone="success">
        <p className="font-semibold">{state.message}</p>
        <p className="mt-2">
          Identifiant : <strong>{String(state.data.login ?? "")}</strong>
          <br />
          Mot de passe provisoire : <strong className="select-all font-mono">{String(state.data.password)}</strong>
        </p>
        <p className="mt-2 text-xs">
          Notez-le maintenant : il ne sera plus affiché. La personne pourra le changer dans « Mon compte ».
        </p>
      </Alert>
      {profileHref ? (
        <Link href={profileHref} className="btn-primary">
          Voir la fiche
        </Link>
      ) : null}
    </div>
  );
}

export function CourierForm({
  id,
  defaults = {},
  vehicles,
  phoneExample,
}: {
  id?: number;
  defaults?: Record<string, string>;
  vehicles: string[];
  phoneExample: string;
}) {
  const [state, action] = useActionState(saveCourierAction, {});
  const formKey = useFormKey(state);
  if (!id && state.ok && state.data) return <Credentials state={state} profileHref={`/livreurs/${state.data.id}`} />;
  const p = (n: string) => inputProps(n, state, defaults);
  const e = (n: string) => state.errors?.[n];
  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom complet" name="name" error={e("name")} required>
          <input {...p("name")} />
        </Field>
        <Field label="Téléphone" name="phone" error={e("phone")} hint="Sert d'identifiant de connexion." required>
          <input {...p("phone")} type="tel" inputMode="tel" placeholder={phoneExample} />
        </Field>
        <Field label="E-mail" name="email" error={e("email")}>
          <input {...p("email")} type="email" inputMode="email" />
        </Field>
        <Field label="Moyen de transport" name="vehicle" error={e("vehicle")}>
          <select {...p("vehicle")}>
            <option value="">—</option>
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Zone habituelle" name="zone" error={e("zone")}>
          <input {...p("zone")} placeholder="ex. Plateau, Médina" />
        </Field>
        {!id ? (
          <Field label="Mot de passe provisoire" name="password" error={e("password")} hint="Laissez vide pour en générer un automatiquement.">
            <input id="password" name="password" type="text" className="input" autoComplete="new-password" />
          </Field>
        ) : null}
        <Field label="Notes internes" name="notes" error={e("notes")} className="sm:col-span-2">
          <textarea {...p("notes")} rows={2} />
        </Field>
      </div>
      <SubmitButton>{id ? "Enregistrer" : "Ajouter le livreur"}</SubmitButton>
    </form>
  );
}

export function MerchantForm({
  id,
  defaults = {},
  paymentMethods,
  neighborhoods,
  phoneExample,
}: {
  id?: number;
  defaults?: Record<string, string>;
  paymentMethods: PaymentMethodConfig[];
  neighborhoods: string[];
  phoneExample: string;
}) {
  const [state, action] = useActionState(saveMerchantAction, {});
  const formKey = useFormKey(state);
  if (!id && state.ok && state.data) return <Credentials state={state} profileHref={`/commercants/${state.data.id}`} />;
  const p = (n: string) => inputProps(n, state, defaults);
  const e = (n: string) => state.errors?.[n];
  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de la boutique" name="name" error={e("name")} required>
          <input {...p("name")} />
        </Field>
        <Field label="Responsable" name="contact_name" error={e("contact_name")} required>
          <input {...p("contact_name")} />
        </Field>
        <Field label="Téléphone" name="phone" error={e("phone")} hint="Sert d'identifiant de connexion." required>
          <input {...p("phone")} type="tel" inputMode="tel" placeholder={phoneExample} />
        </Field>
        <Field label="E-mail" name="email" error={e("email")} hint="Peut aussi servir à se connecter.">
          <input {...p("email")} type="email" inputMode="email" />
        </Field>
        <Field label="Adresse de retrait" name="address" error={e("address")}>
          <input {...p("address")} />
        </Field>
        <Field label="Quartier" name="neighborhood" error={e("neighborhood")}>
          <input {...p("neighborhood")} list="quartiers-m" />
          <datalist id="quartiers-m">
            {neighborhoods.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
        <Field label="Reversement par" name="payout_method" error={e("payout_method")}>
          <select {...p("payout_method")}>
            <option value="">—</option>
            {paymentMethods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Numéro mobile money ou compte" name="payout_account" error={e("payout_account")}>
          <input {...p("payout_account")} />
        </Field>
        {!id ? (
          <Field label="Mot de passe provisoire" name="password" error={e("password")} hint="Laissez vide pour en générer un automatiquement.">
            <input id="password" name="password" type="text" className="input" autoComplete="new-password" />
          </Field>
        ) : null}
        <Field label="Notes internes" name="notes" error={e("notes")} className="sm:col-span-2">
          <textarea {...p("notes")} rows={2} placeholder="Tarifs négociés, horaires de retrait…" />
        </Field>
      </div>
      <SubmitButton>{id ? "Enregistrer" : "Ajouter le commerçant"}</SubmitButton>
    </form>
  );
}

export function ToggleUser({ userId, active, name }: { userId: number; active: boolean; name: string }) {
  return (
    <ActionForm action={toggleUserAction} hidden={{ user_id: userId, active: active ? "0" : "1" }}>
      <ConfirmSubmit
        label={active ? "Désactiver le compte" : "Réactiver le compte"}
        icon={<Power className="h-4 w-4" aria-hidden />}
        className={active ? "btn-secondary btn-sm text-red-700" : "btn-secondary btn-sm"}
        tone={active ? "danger" : "primary"}
        title={active ? `Désactiver ${name} ?` : `Réactiver ${name} ?`}
        message={
          active
            ? "La personne sera déconnectée et ne pourra plus se connecter. Son historique est conservé."
            : "La personne pourra de nouveau se connecter avec son mot de passe."
        }
      />
    </ActionForm>
  );
}

export function ToggleMerchant({ merchantId, active, name }: { merchantId: number; active: boolean; name: string }) {
  return (
    <ActionForm action={toggleMerchantAction} hidden={{ merchant_id: merchantId, active: active ? "0" : "1" }}>
      <ConfirmSubmit
        label={active ? "Désactiver le commerçant" : "Réactiver le commerçant"}
        icon={<Power className="h-4 w-4" aria-hidden />}
        className={active ? "btn-secondary btn-sm text-red-700" : "btn-secondary btn-sm"}
        tone={active ? "danger" : "primary"}
        title={active ? `Désactiver ${name} ?` : `Réactiver ${name} ?`}
        message={
          active
            ? "Ses comptes ne pourront plus se connecter et aucune nouvelle commande ne pourra être créée. Les commandes existantes et l'historique sont conservés."
            : "Ses comptes pourront de nouveau se connecter et créer des commandes."
        }
      />
    </ActionForm>
  );
}

export function ResetPassword({ userId, name }: { userId: number; name: string }) {
  return (
    <ActionForm action={resetPasswordAction} hidden={{ user_id: userId }}>
      {(state) =>
        state.ok && state.data?.password ? (
          <Alert tone="success">
            Nouveau mot de passe de {name} : <strong className="select-all font-mono">{String(state.data.password)}</strong>
            <br />
            <span className="text-xs">Transmettez-le maintenant : il ne sera plus affiché.</span>
          </Alert>
        ) : (
          <ConfirmSubmit
            label="Nouveau mot de passe"
            icon={<KeyRound className="h-4 w-4" aria-hidden />}
            className="btn-secondary btn-sm"
            title={`Générer un nouveau mot de passe pour ${name} ?`}
            message="L'ancien mot de passe ne fonctionnera plus et la personne sera déconnectée de tous ses appareils."
            confirmLabel="Générer"
          />
        )
      }
    </ActionForm>
  );
}

export function AdminForm() {
  const [state, action] = useActionState(createAdminAction, {});
  const e = (n: string) => state.errors?.[n];
  return (
    <form action={action} className="space-y-3" noValidate key={state.ok ? String(state.data?.password) : "form"}>
      {state.ok ? <Credentials state={state} /> : <FormMessage state={state} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom" name="admin_name" error={e("name")} required>
          <input {...inputProps("name", state)} id="admin_name" />
        </Field>
        <Field label="E-mail" name="admin_email" error={e("email")}>
          <input {...inputProps("email", state)} id="admin_email" type="email" />
        </Field>
        <Field label="Téléphone" name="admin_phone" error={e("phone")}>
          <input {...inputProps("phone", state)} id="admin_phone" type="tel" />
        </Field>
        <Field label="Mot de passe provisoire" name="admin_password" error={e("password")} hint="Vide = généré automatiquement.">
          <input id="admin_password" name="password" type="text" className="input" autoComplete="new-password" />
        </Field>
      </div>
      <SubmitButton className="btn-secondary">Ajouter un administrateur</SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess>
      {(state) => (
        <>
          <Field label="Mot de passe actuel" name="current_password" required>
            <input id="current_password" name="current_password" type="password" className="input" autoComplete="current-password" />
          </Field>
          <Field label="Nouveau mot de passe" name="new_password" hint="Au moins 8 caractères." required>
            <input id="new_password" name="new_password" type="password" className="input" autoComplete="new-password" />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" name="confirm_password" error={state.errors?.confirm_password} required>
            <input id="confirm_password" name="confirm_password" type="password" className="input" autoComplete="new-password" />
          </Field>
          <SubmitButton>Changer le mot de passe</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

export function DeleteAccountForm() {
  return (
    <ActionForm action={deleteAccountAction}>
      {(state) => (
        <>
          <p className="text-sm text-ink-soft">
            Votre nom, votre e-mail, votre téléphone et votre mot de passe seront effacés et vous serez déconnecté. L'historique des livraisons
            reste visible par l'entreprise, sous le nom « Compte supprimé ». Cette action est définitive.
          </p>
          <Field label="Mot de passe" name="delete_password" required>
            <input id="delete_password" name="password" type="password" className="input" autoComplete="current-password" />
          </Field>
          <Field label="Tapez SUPPRIMER pour confirmer" name="confirm" error={state.errors?.confirm} required>
            <input id="confirm" name="confirm" className="input" autoComplete="off" />
          </Field>
          <ConfirmSubmit
            label="Supprimer mon compte"
            className="btn-secondary text-red-700"
            tone="danger"
            title="Supprimer définitivement votre compte ?"
            message="Vous ne pourrez plus vous connecter et vos informations personnelles seront effacées."
            confirmLabel="Supprimer"
          />
        </>
      )}
    </ActionForm>
  );
}
