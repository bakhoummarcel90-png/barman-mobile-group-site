import Link from "next/link";
import { Truck } from "lucide-react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <article className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Truck className="h-4 w-4" aria-hidden />
          </span>
          SenLivraison
        </Link>
        <div className="card p-5 sm:p-8">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">Dernière mise à jour : {updated}</p>
          <div className="legal mt-6 space-y-4 text-sm leading-relaxed text-ink-soft [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
            {children}
          </div>
        </div>
      </article>
    </main>
  );
}

/** Affiche une valeur de configuration, ou un repère visible si elle manque. */
export function Configured({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <mark className="rounded bg-amber-100 px-1 text-amber-900">[{label} à compléter]</mark>;
}
