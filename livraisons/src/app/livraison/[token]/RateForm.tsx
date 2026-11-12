"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { rateDeliveryAction } from "@/app/actions";
import { FormMessage, SubmitButton } from "@/components/forms";

export function RateForm({ token }: { token: string }) {
  const [state, action] = useActionState(rateDeliveryAction, {});
  const [rating, setRating] = useState(0);
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating" value={rating} />
      <FormMessage state={state} />
      <p className="font-semibold text-ink">Comment s'est passée la livraison ?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} étoile(s)`} aria-pressed={rating >= n}>
            <Star className={`h-9 w-9 ${rating >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />
          </button>
        ))}
      </div>
      <textarea name="comment" rows={2} maxLength={500} className="input" placeholder="Un commentaire ? (facultatif)" />
      <SubmitButton className="btn-primary w-full" disabled={!rating}>
        Envoyer ma note
      </SubmitButton>
    </form>
  );
}
