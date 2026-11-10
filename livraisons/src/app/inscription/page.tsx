import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { VEHICLES } from "@/lib/people";
import { getCountry } from "@/lib/regions";
import { signupCompany } from "@/lib/signup";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Créer un compte" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  const company = signupCompany();
  if (!company) redirect("/installation");
  const country = getCountry(company.country_code);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Truck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-ink">Créer un compte</h1>
          <p className="mt-1 text-sm text-ink-muted">Rejoignez {company.name} : envoyez vos commandes et colis, ou devenez livreur.</p>
        </div>
        <div className="card p-5 sm:p-6">
          {company.signup_open ? (
            <SignupForm phoneExample={country.phoneExample} neighborhoods={country.neighborhoods} vehicles={VEHICLES} emailRequired={mailConfigured()} />
          ) : (
            <div className="text-center">
              <p className="font-semibold text-ink">Les inscriptions sont fermées pour le moment.</p>
              <p className="mt-1 text-sm text-ink-muted">Contactez {company.name} pour obtenir un compte.</p>
              <Link href="/connexion" className="btn-secondary mt-4">
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
