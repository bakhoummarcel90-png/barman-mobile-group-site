"use client";

import { useActionState } from "react";
import { resendCodeAction, verifyCodeAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function VerifyForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyCodeAction, {});
  const [resendState, resend] = useActionState(resendCodeAction, {});
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <FormMessage state={state} />
        <div>
          <label htmlFor="code" className="label">
            Code reçu par e-mail
          </label>
          <input
            id="code"
            name="code"
            className="input text-center font-mono text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="••••••"
            autoFocus
            required
          />
        </div>
        <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Vérification…">
          Valider le code
        </SubmitButton>
      </form>
      <form action={resend} className="space-y-2 text-center">
        <input type="hidden" name="token" value={token} />
        <FormMessage state={resendState} />
        <SubmitButton className="btn-ghost btn-sm" pendingLabel="Envoi…">
          Je n'ai rien reçu : renvoyer le code
        </SubmitButton>
      </form>
    </div>
  );
}
