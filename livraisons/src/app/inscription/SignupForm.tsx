"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Bike, Plane, Store, User } from "lucide-react";
import { signupAction } from "../actions";
import { Field, FormMessage, inputProps, SubmitButton, useFormKey } from "@/components/forms";
import { cx } from "@/components/ui";

const KINDS = [
  { value: "commercant", label: "Commerçant", hint: "Boutique en ligne, vendeur", icon: Store },
  { value: "particulier", label: "Particulier", hint: "Envoyer ou recevoir un colis", icon: User },
  { value: "livreur", label: "Livreur", hint: "Effectuer des livraisons", icon: Bike },
  { value: "gp", label: "GP", hint: "Je voyage et transporte des colis", icon: Plane },
] as const;

export function SignupForm({
  phoneExample,
  neighborhoods,
  vehicles,
  emailRequired,
  initialKind,
}: {
  phoneExample: string;
  neighborhoods: string[];
  vehicles: string[];
  /** Vérification par e-mail configurée : e-mail obligatoire, code envoyé. */
  emailRequired: boolean;
  /** Type de compte présélectionné (ex. « gp » depuis la page des voyages). */
  initialKind?: string;
}) {
  const [state, action] = useActionState(signupAction, {});
  const formKey = useFormKey(state);
  const [kind, setKind] = useState<string>(state.values?.kind ?? initialKind ?? "commercant");
  const p = (n: string) => inputProps(n, state);
  const e = (n: string) => state.errors?.[n];

  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <fieldset>
        <legend className="label">Je suis…</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => (
            <label
              key={k.value}
              className={cx(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center text-sm transition",
                kind === k.value ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/30" : "border-slate-300 bg-white text-ink-soft",
              )}
            >
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              <k.icon className="h-6 w-6" aria-hidden />
              <span className="font-semibold">{k.label}</span>
              <span className="hidden text-xs text-ink-muted sm:block">{k.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {kind === "livreur" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Votre inscription sera examinée par l'entreprise de livraison. Vous pourrez vous connecter dès qu'elle sera acceptée.
        </p>
      ) : kind === "gp" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Vous voyagez entre le Sénégal et d'autres pays et transportez des colis ? Inscrivez-vous : après vérification de votre identité, vous pourrez
          publier vos voyages et recevoir des réservations. Inscription gratuite.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "commercant" ? (
          <Field label="Nom de la boutique" name="shop_name" error={e("shop_name")} required className="sm:col-span-2">
            <input {...p("shop_name")} placeholder="ex. Boutique Awa Mode" autoComplete="organization" />
          </Field>
        ) : null}
        <Field label={kind === "commercant" ? "Votre nom (responsable)" : kind === "gp" ? "Nom complet (comme sur votre pièce d'identité)" : "Nom complet"} name="contact_name" error={e("contact_name")} required>
          <input {...p("contact_name")} autoComplete="name" />
        </Field>
        <Field label="Téléphone" name="phone" error={e("phone")} hint="Sert à vous connecter." required>
          <input {...p("phone")} type="tel" inputMode="tel" placeholder={phoneExample} autoComplete="tel" />
        </Field>
        <Field
          label="E-mail"
          name="email"
          error={e("email")}
          required={emailRequired}
          hint={emailRequired ? "Un code de vérification vous sera envoyé." : undefined}
        >
          <input {...p("email")} type="email" inputMode="email" autoComplete="email" />
        </Field>
        {kind === "gp" ? (
          <Field label="Trajets habituels" name="zone" error={e("zone")} hint="Aide l'entreprise à valider votre inscription.">
            <input {...p("zone")} placeholder="ex. Dakar ↔ Paris, Dakar ↔ Milan" maxLength={120} />
          </Field>
        ) : kind === "livreur" ? (
          <>
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
          </>
        ) : (
          <>
            <Field label="Quartier" name="neighborhood" error={e("neighborhood")}>
              <input {...p("neighborhood")} list="quartiers-signup" />
              <datalist id="quartiers-signup">
                {neighborhoods.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
            <Field label="Adresse" name="address" error={e("address")} className="sm:col-span-2">
              <input {...p("address")} autoComplete="street-address" />
            </Field>
          </>
        )}
        <Field label="Mot de passe" name="password" error={e("password")} hint="Au moins 8 caractères." required>
          <input id="password" name="password" type="password" className="input" autoComplete="new-password" />
        </Field>
        <Field label="Confirmer le mot de passe" name="confirm_password" error={e("confirm_password")} required>
          <input id="confirm_password" name="confirm_password" type="password" className="input" autoComplete="new-password" />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="accept" value="1" className="mt-1 h-4 w-4" defaultChecked={state.values?.accept === "1"} />
        <span>
          J'accepte la{" "}
          <Link href="/confidentialite" className="link" target="_blank">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      {e("accept") ? <p className="-mt-2 text-sm font-medium text-red-700">{e("accept")}</p> : null}

      <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Création du compte…">
        {emailRequired ? "Recevoir mon code par e-mail" : kind === "livreur" || kind === "gp" ? "Envoyer ma demande" : "Créer mon compte"}
      </SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="link">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
