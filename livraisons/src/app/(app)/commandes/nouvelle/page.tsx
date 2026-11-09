import type { Metadata } from "next";
import { DeliveryForm } from "@/components/DeliveryForm";
import { Alert, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { courierOptions, merchantOptions } from "@/lib/people";

export const metadata: Metadata = { title: "Nouvelle commande" };

export default async function NewOrderPage() {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  const merchants = merchantOptions(user);
  return (
    <>
      <PageHeader title="Nouvelle commande" back={{ href: "/commandes", label: "Commandes" }} />
      {user.role === "admin" && !merchants.some((m) => m.active) ? (
        <div className="mb-4">
          <Alert tone="warning">Ajoutez d'abord un commerçant actif dans la page Commerçants.</Alert>
        </div>
      ) : null}
      <DeliveryForm
        merchants={merchants}
        couriers={courierOptions(user)}
        paymentMethods={country.paymentMethods}
        neighborhoods={country.neighborhoods}
        currencyLabel={country.currencyLabel}
        isAdmin={user.role === "admin"}
        defaults={{ expected_payment_method: "cash", delivery_fee: "", amount_to_collect: "" }}
      />
    </>
  );
}
