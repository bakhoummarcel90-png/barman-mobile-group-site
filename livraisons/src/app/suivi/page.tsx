import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { normalizeTrackingNumber } from "@/lib/shipments";

export const metadata: Metadata = { title: "Suivre un colis" };
export const dynamic = "force-dynamic";

/** Page publique : le client saisit son numéro de suivi (aucun compte nécessaire). */
export default async function TrackSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const numero = (await searchParams).numero;
  if (numero && normalizeTrackingNumber(numero)) redirect(`/suivi/${normalizeTrackingNumber(numero)}`);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Package className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-ink">Suivre mon colis</h1>
          <p className="mt-1 text-sm text-ink-muted">Saisissez le numéro de suivi reçu de votre entreprise de livraison (il commence par SL).</p>
        </div>
        <form method="get" className="card space-y-3 p-5">
          <label htmlFor="numero" className="label">
            Numéro de suivi
          </label>
          <input id="numero" name="numero" className="input font-mono uppercase" placeholder="ex. SL7KQ2M9XA" autoComplete="off" required />
          <button type="submit" className="btn-primary btn-lg w-full">
            Suivre
          </button>
        </form>
      </div>
    </main>
  );
}
