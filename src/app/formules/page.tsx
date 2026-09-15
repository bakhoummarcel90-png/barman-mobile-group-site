import type { Metadata } from "next";
import { formules, facteursDePrix } from "@/config/pricing";
import FormuleCard from "@/components/FormuleCard";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nos formules",
  description:
    "Essential, Essential+, Prestige, Signature ou VIP sur mesure : découvrez les formules de Barman Mobile Group et les critères qui déterminent votre devis.",
  alternates: { canonical: "/formules" },
};

export default function FormulesPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Nos formules</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
            Une formule pour chaque événement
          </h1>
          <p className="mt-6 text-ivoire/65">
            Nos formules donnent un point de départ clair. Le tarif exact de votre prestation
            dépend toujours de vos critères propres et vous est communiqué après étude de
            votre demande.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {formules.map((formule, i) => (
            <Reveal key={formule.slug} delayMs={i * 60}>
              <FormuleCard formule={formule} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 rounded-2xl border border-champagne/15 bg-nuit-soft p-8">
          <h2 className="font-display text-2xl text-ivoire">Ce qui détermine votre tarif</h2>
          <p className="mt-3 max-w-2xl text-sm text-ivoire/60">
            Prestations à Dakar et partout au Sénégal. Les frais de transport et de logistique
            hors Dakar sont calculés selon la distance et les besoins de l'événement.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {facteursDePrix.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-ivoire/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
