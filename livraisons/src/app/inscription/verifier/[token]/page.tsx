import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { verificationTarget } from "@/lib/verification";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = { title: "Vérifier mon e-mail" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const target = verificationTarget(token);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-ink">Vérifiez votre e-mail</h1>
          {target ? (
            <p className="mt-1 text-sm text-ink-muted">
              Nous avons envoyé un code à 6 chiffres à <strong>{target.email}</strong>. Il est valable 15 minutes. Pensez à regarder dans les
              courriers indésirables (spam).
            </p>
          ) : null}
        </div>
        <div className="card p-5 sm:p-6">
          {target ? (
            <VerifyForm token={token} />
          ) : (
            <div className="text-center">
              <p className="font-semibold text-ink">Ce lien de vérification n'est plus valable.</p>
              <p className="mt-1 text-sm text-ink-muted">Recommencez l'inscription, ou connectez-vous : un nouveau code vous sera envoyé.</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/inscription" className="btn-primary">
                  Recommencer l'inscription
                </Link>
                <Link href="/connexion" className="btn-secondary">
                  Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
