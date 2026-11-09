"use client";

import { useActionState } from "react";
import { setupAction } from "../actions";
import { Field, FormMessage, inputProps, SubmitButton } from "@/components/forms";

export function SetupForm({ codeRequired }: { codeRequired: boolean }) {
  const [state, action] = useActionState(setupAction, {});
  const p = (n: string) => inputProps(n, state);
  const e = (n: string) => state.errors?.[n];
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      {codeRequired ? (
        <Field label="Code d'installation" name="setup_code" error={e("setup_code")} hint="La valeur de SETUP_CODE définie chez votre hébergeur." required>
          <input {...p("setup_code")} autoComplete="off" />
        </Field>
      ) : null}
      <fieldset className="space-y-4">
        <legend className="mb-2 font-semibold text-ink">Votre entreprise</legend>
        <Field label="Nom de l'entreprise de livraison" name="company_name" error={e("company_name")} required>
          <input {...p("company_name")} placeholder="ex. Dakar Express Livraison" />
        </Field>
        <Field label="Téléphone de l'entreprise" name="company_phone" error={e("company_phone")}>
          <input {...p("company_phone")} type="tel" inputMode="tel" />
        </Field>
      </fieldset>
      <fieldset className="space-y-4 border-t border-slate-100 pt-4">
        <legend className="mb-2 font-semibold text-ink">Votre compte administrateur</legend>
        <Field label="Votre nom" name="admin_name" error={e("admin_name")} required>
          <input {...p("admin_name")} autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail" name="email" error={e("email")} hint="E-mail ou téléphone : sert à se connecter.">
            <input {...p("email")} type="email" inputMode="email" autoComplete="email" />
          </Field>
          <Field label="Téléphone" name="phone" error={e("phone")}>
            <input {...p("phone")} type="tel" inputMode="tel" placeholder="77 123 45 67" />
          </Field>
          <Field label="Mot de passe" name="password" error={e("password")} hint="Au moins 8 caractères." required>
            <input id="password" name="password" type="password" className="input" autoComplete="new-password" />
          </Field>
          <Field label="Confirmer le mot de passe" name="confirm_password" error={e("confirm_password")} required>
            <input id="confirm_password" name="confirm_password" type="password" className="input" autoComplete="new-password" />
          </Field>
        </div>
      </fieldset>
      <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Création…">
        Créer mon entreprise
      </SubmitButton>
    </form>
  );
}
