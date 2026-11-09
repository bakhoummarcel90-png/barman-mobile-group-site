"use client";

import { CheckCircle2 } from "lucide-react";
import { courierRemittanceAction, merchantPayoutAction, quickConfirmAction } from "@/app/actions";
import type { PaymentMethodConfig } from "@/lib/regions";
import { ActionForm, ConfirmSubmit } from "./forms";

export function SettleForm({
  kind,
  id,
  who,
  amountLabel,
  defaultMethod,
  paymentMethods,
  owed = false,
}: {
  kind: "courier" | "merchant";
  id: number;
  who: string;
  amountLabel: string;
  defaultMethod?: string | null;
  paymentMethods: PaymentMethodConfig[];
  /** Solde négatif : les frais dépassent les encaissements, c'est le commerçant qui paie (amountLabel = valeur absolue). */
  owed?: boolean;
}) {
  const isCourier = kind === "courier";
  const shown = amountLabel;
  return (
    <ActionForm action={isCourier ? courierRemittanceAction : merchantPayoutAction} hidden={{ id }}>
      <div className="grid gap-2 sm:grid-cols-3">
        <label>
          <span className="text-xs text-ink-muted">Moyen</span>
          <select name="method" className="input" defaultValue={defaultMethod ?? "cash"}>
            {paymentMethods.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs text-ink-muted">Référence (facultatif)</span>
          <input name="reference" className="input" placeholder="N° de transaction, reçu…" maxLength={60} />
        </label>
        <label>
          <span className="text-xs text-ink-muted">Note (facultatif)</span>
          <input name="note" className="input" maxLength={200} />
        </label>
      </div>
      <ConfirmSubmit
        label={isCourier ? `Remise reçue (${amountLabel})` : owed ? `Frais réglés par le commerçant (${shown})` : `Reversement effectué (${amountLabel})`}
        className="btn-primary btn-sm"
        title={isCourier ? `Confirmer la remise de ${who} ?` : owed ? `${who} a réglé ses frais ?` : `Confirmer le reversement à ${who} ?`}
        message={
          owed
            ? `Vous confirmez avoir reçu ${shown} de ${who} pour les frais de livraison de commandes déjà payées. Les livraisons concernées seront soldées.`
            : isCourier
            ? `Vous confirmez avoir reçu ${amountLabel} de ${who}. Les livraisons concernées seront marquées comme remises.`
            : `Vous confirmez avoir versé ${amountLabel} à ${who}. Faites le transfert Wave / Orange Money ou la remise en espèces vous-même : rien n'est envoyé par l'application.`
        }
      />
    </ActionForm>
  );
}

export function QuickConfirm({ id, label }: { id: number; label: string }) {
  return (
    <ActionForm action={quickConfirmAction} hidden={{ id }}>
      <ConfirmSubmit
        label="Confirmer"
        icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
        className="btn-secondary btn-sm"
        title="Confirmer cet encaissement ?"
        message={label}
      />
    </ActionForm>
  );
}
