import type { Metadata } from "next";
import { MerchantForm } from "@/components/PeopleForms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { countryOf } from "@/lib/company";

export const metadata: Metadata = { title: "Ajouter un commerçant" };

export default async function NewMerchantPage() {
  const user = await requireUser(["admin"]);
  const country = countryOf(user);
  return (
    <>
      <PageHeader
        title="Ajouter un commerçant"
        description="La boutique et son compte d'accès sont créés en même temps."
        back={{ href: "/commercants", label: "Commerçants" }}
      />
      <div className="card p-4 sm:p-5">
        <MerchantForm paymentMethods={country.paymentMethods} neighborhoods={country.neighborhoods} />
      </div>
    </>
  );
}
