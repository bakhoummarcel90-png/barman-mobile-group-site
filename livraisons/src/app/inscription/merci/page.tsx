import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Demande envoyée" };

export default async function SignupThanksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const verified = params.verifie === "1";
  const isGp = params.type === "gp";
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="card w-full max-w-md p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" aria-hidden />
        <h1 className="mt-3 text-xl font-bold text-ink">{verified ? "E-mail confirmé, demande envoyée" : "Demande envoyée"}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {isGp
            ? "Merci ! L'entreprise va vérifier votre identité (elle peut vous appeler). Dès que votre inscription de GP sera acceptée, connectez-vous avec votre numéro de téléphone et votre mot de passe pour publier vos voyages."
            : "Merci ! L'entreprise de livraison va examiner votre inscription de livreur. Dès qu'elle sera acceptée, connectez-vous avec votre numéro de téléphone et votre mot de passe."}
        </p>
        <Link href="/connexion" className="btn-primary mt-5 w-full">
          Aller à la connexion
        </Link>
      </div>
    </main>
  );
}
