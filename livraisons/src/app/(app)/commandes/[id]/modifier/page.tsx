import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeliveryForm } from "@/components/DeliveryForm";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { companyTariffs } from "@/lib/deliveries";
import { countryOf } from "@/lib/company";
import { canEdit, deliveryFormValues, getDelivery } from "@/lib/deliveries";
import { courierOptions, favoriteCourierOptions, merchantOptions, merchantPickups } from "@/lib/people";

export const metadata: Metadata = { title: "Modifier la commande" };

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  const d = getDelivery(user, Number((await params).id));
  if (!d) notFound();
  const back = { href: `/commandes/${d.id}`, label: d.reference };
  if (!canEdit(user, d)) {
    return (
      <>
        <PageHeader title="Modifier la commande" back={back} />
        <Alert tone="warning">
          {user.role === "merchant"
            ? "La course a démarré ou est terminée : contactez l'entreprise de livraison pour toute modification."
            : "Cette livraison est terminée et ne peut plus être modifiée."}
        </Alert>
      </>
    );
  }
  return (
    <>
      <PageHeader title={`Modifier ${d.reference}`} back={back} />
      <DeliveryForm
        id={d.id}
        defaults={deliveryFormValues(d, country)}
        merchants={merchantOptions(user)}
        couriers={courierOptions(user)}
        paymentMethods={country.paymentMethods}
        neighborhoods={country.neighborhoods}
        currencyLabel={country.currencyLabel}
        phoneExample={country.phoneExample}
        city={country.city}
        tariffs={companyTariffs(user.companyId)}
        pickupByMerchant={user.role === "admin" ? merchantPickups(user) : {}}
        ownPickup={user.role === "merchant" ? merchantPickups(user)[String(user.merchantId)] : null}
        favorites={favoriteCourierOptions(user)}
        isAdmin={user.role === "admin"}
        courierLocked={d.status === "en_cours"}
      />
    </>
  );
}
