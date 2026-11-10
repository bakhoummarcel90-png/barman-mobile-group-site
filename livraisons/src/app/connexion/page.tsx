import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { signupCompany } from "@/lib/signup";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  // Aucun compte : première installation.
  if (!get("SELECT 1 FROM users LIMIT 1")) redirect("/installation");
  // Le rappel des comptes de démonstration n'apparaît que si la démo est installée.
  const signupOpen = !!signupCompany()?.signup_open;
  const demo = process.env.HIDE_DEMO_HINT !== "1" && !!get("SELECT 1 FROM users WHERE email = 'admin@demo.sn'");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Truck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-ink">SenLivraison</h1>
          <p className="mt-1 text-sm text-ink-muted">Commandes, livreurs et encaissements, au même endroit.</p>
        </div>
        <div className="card p-5 sm:p-6">
          <LoginForm />
        </div>
        {signupOpen ? (
          <Link href="/inscription" className="btn-secondary mt-3 w-full">
            Créer un compte (commerçant, particulier, livreur)
          </Link>
        ) : null}
        <p className="mt-3 text-center text-sm">
          Vous attendez un colis ?{" "}
          <Link href="/suivi" className="link">
            Suivre mon colis
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link href="/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/suppression-compte" className="hover:underline">
            Supprimer son compte
          </Link>
        </p>

        {demo ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <p className="font-semibold">Comptes de démonstration</p>
            <ul className="mt-1 space-y-0.5">
              <li>
                Administrateur : <strong>admin@demo.sn</strong>
              </li>
              <li>
                Commerçant : <strong>boutique@demo.sn</strong>
              </li>
              <li>
                Livreur : <strong>70 000 00 11</strong>
              </li>
            </ul>
            <p className="mt-2 text-xs">
              Mot de passe : celui affiché par <code>npm run seed</code> (ou la valeur de <code>DEMO_PASSWORD</code>).
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
