import type { Metadata } from "next";
import { TripForm } from "@/components/GpForms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { todayLocal } from "@/lib/format";
import { SHIPPING_COUNTRIES } from "@/lib/regions";

export const metadata: Metadata = { title: "Nouveau voyage" };

export default async function NewTripPage() {
  const user = await requireUser(["gp"]);
  const country = countryOf(user);
  const countries = Object.entries(SHIPPING_COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <>
      <PageHeader title="Nouveau voyage" description="Les expéditeurs verront votre trajet, vos dates, les kilos disponibles et votre prix au kilo. Votre téléphone reste caché jusqu'au paiement des frais." back={{ href: "/gp", label: "Mes voyages" }} />
      <TripForm countries={countries} today={todayLocal(country.timezone)} defaults={{ origin_country: country.code, origin_city: country.city, currency: "XOF" }} />
    </>
  );
}
