import type { Metadata } from "next";
import { ShipmentForm } from "@/components/ShipmentForms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { merchantOptions } from "@/lib/people";
import { SHIPMENT_CURRENCIES, SHIPPING_COUNTRIES } from "@/lib/regions";

export const metadata: Metadata = { title: "Nouveau colis" };

export default async function NewShipmentPage() {
  const user = await requireUser(["admin", "merchant"]);
  const country = countryOf(user);
  return (
    <>
      <PageHeader
        title="Nouveau colis international"
        description="Un numéro de suivi est créé automatiquement : transmettez-le à votre client."
        back={{ href: "/colis", label: "Colis" }}
      />
      <ShipmentForm
        merchants={merchantOptions(user)}
        isAdmin={user.role === "admin"}
        countries={Object.entries(SHIPPING_COUNTRIES)}
        currencies={SHIPMENT_CURRENCIES}
        currencyLabel={country.currencyLabel}
        defaults={{
          destination_country: country.code,
          destination_city: country.city,
          transport_mode: "aerien",
          pieces: "1",
          declared_currency: "EUR",
          fee_paid: "0",
        }}
      />
    </>
  );
}
