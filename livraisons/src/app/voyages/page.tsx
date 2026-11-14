import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plane, Search, ShieldCheck, Wallet } from "lucide-react";
import { LaunchBanner } from "@/components/Growth";
import { TripCard } from "@/components/GpTripCard";
import { EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { gpSettings, openTrips } from "@/lib/gp";
import { getCountry, SHIPPING_COUNTRIES } from "@/lib/regions";
import { signupCompany } from "@/lib/signup";

export const metadata: Metadata = {
  title: "Voyages GP : envoyer un colis entre le Sénégal et l'étranger",
  description:
    "Trouvez un GP (voyageur) qui part de Dakar vers Paris, Milan, New York… ou qui rentre au Sénégal, et réservez des kilos pour votre colis. GP vérifiés, prix au kilo affiché.",
};
export const dynamic = "force-dynamic";

/** Liste publique des voyages GP ouverts (sans le téléphone ni le nom complet des GP). */
export default async function PublicTripsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const company = signupCompany();
  if (!company) redirect("/installation");
  const params = await searchParams;
  const filters = { from: params.de, to: params.vers, month: params.mois };
  const trips = openTrips(company.id, filters);
  const country = getCountry(company.country_code);
  const { fee } = gpSettings(company.id);
  const countries = Object.entries(SHIPPING_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1], "fr"));

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Plane className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-bold text-ink">{company.name}</span>
              <span className="block text-xs text-ink-muted">Voyages GP</span>
            </span>
          </Link>
          <div className="flex gap-2">
            <Link href="/connexion?suite=/gp" className="btn-secondary btn-sm">
              Se connecter
            </Link>
            <Link href="/inscription?type=particulier" className="btn-primary btn-sm">
              Créer un compte
            </Link>
          </div>
        </header>

        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Envoyez votre colis avec un GP</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Des voyageurs vérifiés transportent vos colis entre le Sénégal et l'étranger, au prix du kilo. Choisissez un voyage, réservez vos kilos, puis contactez
          directement votre GP.
        </p>

        {fee === 0 ? <LaunchBanner className="mt-5" /> : null}
        <div className="my-5 grid gap-3 sm:grid-cols-3">
          <div className="card flex items-start gap-3 p-4">
            <ShieldCheck className="h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">GP vérifiés</span> : identité contrôlée avant toute publication, et notés par les expéditeurs.
            </p>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <Wallet className="h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">Prix clair</span> : prix au kilo affiché{fee ? `, frais de mise en relation de ${formatMoney(fee, country)}` : ", sans frais de mise en relation"}.
            </p>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <Plane className="h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">Vous êtes GP ?</span>{" "}
              <Link href="/inscription?type=gp" className="link">
                Publiez vos voyages gratuitement
              </Link>
              .
            </p>
          </div>
        </div>

        <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-4 sm:items-end" role="search">
          <label className="block">
            <span className="label">Départ de</span>
            <select name="de" defaultValue={filters.from ?? ""} className="input">
              <option value="">Tous les pays</option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Arrivée à</span>
            <select name="vers" defaultValue={filters.to ?? ""} className="input">
              <option value="">Tous les pays</option>
              {countries.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Mois du départ</span>
            <input type="month" name="mois" defaultValue={filters.month ?? ""} className="input" />
          </label>
          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" aria-hidden /> Rechercher
          </button>
        </form>

        {trips.length ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <TripCard key={t.id} t={t} href={`/connexion?suite=/gp/voyages/${t.id}`} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Plane} title="Aucun voyage pour cette recherche">
            Essayez un autre mois ou un autre pays. De nouveaux voyages sont publiés régulièrement.
          </EmptyState>
        )}
        <p className="mt-6 text-center text-xs text-ink-muted">
          Pour réserver, connectez-vous ou créez un compte gratuit. ·{" "}
          <Link href="/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
        </p>
      </div>
    </main>
  );
}
