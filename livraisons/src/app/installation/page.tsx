import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { needsSetup, setupCodeRequired } from "@/lib/setup";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Installation" };
export const dynamic = "force-dynamic";

export default function SetupPage() {
  if (!needsSetup()) redirect("/connexion");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Truck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-ink">Bienvenue sur SenLivraison</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Créez votre entreprise de livraison et votre compte administrateur. Vous ajouterez ensuite vos livreurs et vos commerçants.
          </p>
        </div>
        <div className="card p-5 sm:p-6">
          <SetupForm codeRequired={setupCodeRequired()} />
        </div>
      </div>
    </main>
  );
}
