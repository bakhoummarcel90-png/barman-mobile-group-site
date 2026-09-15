import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import PlaceholderImage from "@/components/PlaceholderImage";
import StatsCounters from "@/components/StatsCounters";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "À propos de Barman Mobile Group",
  description:
    "Barman Mobile Group, entreprise événementielle intégrée fondée à Dakar en 2019, réunit bar mobile, catering, open grill, location et personnel événementiel.",
  alternates: { canonical: "/a-propos" },
};

export default function AProposPage() {
  return (
    <>
      <section className="px-5 pb-16 pt-36">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">À propos</p>
            <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
              Une entreprise sénégalaise, des standards internationaux
            </h1>
            <p className="mt-6 text-ivoire/65">
              Barman Mobile a été fondé à Dakar en {siteConfig.foundingYear} par{" "}
              {siteConfig.founder}, barman professionnel formé notamment à l'European Bartender
              School de Paris. À l'origine spécialisée dans les bars mobiles, les cocktails et
              les mariages, l'entreprise a progressivement élargi son savoir-faire pour devenir
              Barman Mobile Group : une organisation événementielle intégrée.
            </p>
            <p className="mt-4 text-ivoire/65">
              Notre ambition est de devenir la référence nationale au Sénégal pour les services
              événementiels premium et intégrés, avant de développer progressivement la marque
              en Afrique de l'Ouest.
            </p>
          </Reveal>
          <Reveal>
            <PlaceholderImage
              description="Marcel Bakhoum, fondateur de Barman Mobile Group"
              src="/images/marcel-portrait.webp"
              aspect="aspect-[4/5]"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-nuit-soft px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <StatsCounters />
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire">Notre positionnement</h2>
            <ul className="mt-6 space-y-3 text-sm text-ivoire/70">
              {[
                "Premium mais accessible",
                "Service professionnel, élégant et clé en main",
                "Expérience personnalisée pour chaque client",
                "Équipe qualifiée et encadrée",
                "Matériel professionnel et présentation soignée",
                "Créativité, fiabilité et sens du détail",
                "Une forte identité sénégalaise, avec des standards internationaux",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
