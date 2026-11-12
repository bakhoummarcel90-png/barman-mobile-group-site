"use client";

import { acceptDeliveryAction } from "@/app/actions";
import { ActionForm, SubmitButton } from "./forms";

export function AcceptButton({ id }: { id: number }) {
  return (
    <ActionForm action={acceptDeliveryAction} hidden={{ id }}>
      <SubmitButton className="btn-primary btn-lg w-full" pendingLabel="Acceptation…">
        Accepter la course
      </SubmitButton>
    </ActionForm>
  );
}
