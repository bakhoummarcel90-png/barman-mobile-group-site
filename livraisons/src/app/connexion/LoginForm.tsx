"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function LoginForm({ next, contactEmail, whatsapp }: { next?: string | null; contactEmail?: string | null; whatsapp?: string | null }) {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      {next ? <input type="hidden" name="suite" value={next} /> : null}
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
        Mot de passe oublié ?{" "}
        {whatsapp || contactEmail ? (
          <>
            Contactez-nous
            {whatsapp ? (
              <>
                {" "}
                sur{" "}
                <a className="link" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Bonjour, j'ai oublié mon mot de passe Sen Service Livraisons.")}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </>
            ) : null}
            {whatsapp && contactEmail ? " ou" : null}
            {contactEmail ? (
              <>
                {" "}
                par e-mail :{" "}
                <a className="link" href={`mailto:${contactEmail}?subject=${encodeURIComponent("Mot de passe oublié")}`}>
                  {contactEmail}
                </a>
              </>
            ) : null}
            {" "}: nous vous donnerons un nouveau mot de passe.
          </>
        ) : (
          "Contactez l'entreprise : elle vous donnera un nouveau mot de passe."
        )}
      </p>
    </form>
  );
}
