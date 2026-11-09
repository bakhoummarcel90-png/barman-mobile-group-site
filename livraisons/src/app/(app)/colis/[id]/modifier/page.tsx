import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShipmentForm } from "@/components/ShipmentForms";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { merchantOptions } from "@/lib/people";
import { SHIPMENT_CURRENCIES, SHIPPING_COUNTRIES } from "@/lib/regions";
import { canEditShipment, getShipment, shipmentFormValues } from "@/lib/shipments";

export const metadata: Metadata = { title: "Modifier le colis" };

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "merchant"]);
  const s = getShipment(user, Number((await params).id));
  if (!s) notFound();
  const back = { href: `/colis/${s.id}`, label: s.tracking_number };
  if (!canEditShipment(user, s)) {
    return (
      <>
        <PageHeader title="Modifier le colis" back={back} />
        <Alert tone="warning">
          {user.role === "merchant"
            ? "Le colis a été pris en charge : contactez l'entreprise pour toute modification."
            : "Ce colis est clôturé (livré ou annulé)."}
        </Alert>
      </>
    );
  }
  return (
    <>
      <PageHeader title={`Modifier ${s.tracking_number}`} back={back} />
      <ShipmentForm
        id={s.id}
        defaults={shipmentFormValues(s)}
        merchants={merchantOptions(user)}
        isAdmin={user.role === "admin"}
        countries={Object.entries(SHIPPING_COUNTRIES)}
        currencies={SHIPMENT_CURRENCIES}
        currencyLabel={countryOf(user).currencyLabel}
      />
    </>
  );
}
