import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import Link from "next/link";
import { ChangePasswordForm, DeleteAccountForm } from "@/components/PeopleForms";
import { Card, DefinitionList, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { countryOf } from "@/lib/company";
import { ROLE_LABELS } from "@/lib/constants";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser([...ROLES]);
  const country = countryOf(user);
  return (
    <>
      <PageHeader title="Mon compte" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profil">
          <DefinitionList
            items={[
              ["Nom", user.name],
              ["Rôle", ROLE_LABELS[user.role]],
              ["Entreprise", user.companyName],
              ["E-mail", user.email],
              ["Téléphone", user.phone ? formatPhone(user.phone, country) : null],
            ]}
          />
          <p className="mt-3 text-xs text-ink-muted">Pour modifier ces informations, contactez l'administrateur.</p>
          <form action={logoutAction} className="mt-4">
            <button type="submit" className="btn-secondary">
              <LogOut className="h-4 w-4" aria-hidden /> Se déconnecter
            </button>
          </form>
        </Card>
        <Card title="Changer mon mot de passe">
          <ChangePasswordForm />
        </Card>
        <Card title="Supprimer mon compte" className="lg:col-span-2">
          <DeleteAccountForm />
          <p className="mt-3 text-xs text-ink-muted">
            <Link href="/confidentialite" className="link">
              Politique de confidentialité
            </Link>
          </p>
        </Card>
      </div>
    </>
  );
}
