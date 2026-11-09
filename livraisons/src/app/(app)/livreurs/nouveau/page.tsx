import type { Metadata } from "next";
import { CourierForm } from "@/components/PeopleForms";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { VEHICLES } from "@/lib/people";

export const metadata: Metadata = { title: "Ajouter un livreur" };

export default async function NewCourierPage() {
  await requireUser(["admin"]);
  return (
    <>
      <PageHeader title="Ajouter un livreur" back={{ href: "/livreurs", label: "Livreurs" }} />
      <div className="card p-4 sm:p-5">
        <CourierForm vehicles={VEHICLES} />
      </div>
    </>
  );
}
