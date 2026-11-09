"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <div>
        <label htmlFor="identifier" className="label">
          E-mail ou numéro de téléphone
        </label>
        <input
          id="identifier"
          name="identifier"
          className="input"
          autoComplete="username"
          inputMode="email"
          placeholder="Votre e-mail ou votre numéro"
          defaultValue={state.values?.identifier ?? ""}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Connexion…">
        Se connecter
      </SubmitButton>
      <p className="text-center text-xs text-ink-muted">
        Mot de passe oublié ? Demandez à l'administrateur de votre entreprise de livraison d'en générer un nouveau.
      </p>
    </form>
  );
}
