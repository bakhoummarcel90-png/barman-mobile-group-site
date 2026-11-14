import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TripForm } from "@/components/GpForms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";
import { todayLocal } from "@/lib/format";
import { canManageTrip, getTrip, tripFormValues } from "@/lib/gp";
import { SHIPPING_COUNTRIES } from "@/lib/regions";

export const metadata: Metadata = { title: "Modifier le voyage" };

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["gp", "admin"]);
  const t = getTrip(user, Number((await params).id));
  if (!t || !canManageTrip(user, t) || t.status === "annule") notFound();
  const countries = Object.entries(SHIPPING_COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <>
      <PageHeader title="Modifier le voyage" back={{ href: `/gp/voyages/${t.id}`, label: "Retour au voyage" }} />
      <TripForm id={t.id} countries={countries} today={todayLocal(countryOf(user).timezone)} defaults={tripFormValues(t)} />
    </>
  );
}
