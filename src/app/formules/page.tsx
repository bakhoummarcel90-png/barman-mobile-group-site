import type { Metadata } from "next";
import { pageOpenGraph } from "@/lib/seo";
import { formules, facteursDePrix, modelesBars, barsParInvites, personnalisationBars, optionBarSupplementaire } from "@/config/pricing";
import FormuleCard from "@/components/FormuleCard";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nos formules",
  description:
    "Essential, Essential+, Prestige, Signature ou VIP sur mesure : découvrez les formules de Barman Mobile Group et les critères qui déterminent votre devis.",
  alternates: { canonical: "/formules" },
  openGraph: pageOpenGraph("/formules"),
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

        <section id="nos-bars" className="mt-20 scroll-mt-28">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Nos bars</p>
            <h2 className="mt-3 font-display text-3xl text-ivoire">Le bon bar pour votre nombre d'invités</h2>
            <p className="mt-4 max-w-2xl text-ivoire/65">
              Chaque formule part avec un bar standard. Plus vos invités sont nombreux, plus il
              faut d'espace de service : nous ajoutons alors des bars pour que l'équipe travaille
              confortablement et que le service reste fluide.
            </p>
          </Reveal>

          <Reveal className="mt-8 overflow-x-auto rounded-2xl border border-champagne/15 bg-nuit-soft">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-champagne/15 text-xs uppercase tracking-[0.12em] text-champagne/80">
                  <th className="px-5 py-4 font-medium">Nombre d'invités</th>
                  <th className="px-5 py-4 font-medium">Bars inclus</th>
                  <th className="px-5 py-4 font-medium">Longueur de comptoir</th>
                </tr>
              </thead>
              <tbody>
                {barsParInvites.map((ligne) => (
                  <tr key={ligne.invites} className="border-b border-champagne/10 last:border-0">
                    <td className="px-5 py-4 text-ivoire">{ligne.invites}</td>
                    <td className="px-5 py-4 text-ivoire/75">
                      {ligne.bars.length
                        ? ligne.bars.map((b) => `${b.quantite} ${b.quantite > 1 ? modelesBars[b.type].pluriel : modelesBars[b.type].nom.toLowerCase()}`).join(" + ")
                        : "Configuration sur mesure"}
                    </td>
                    <td className="px-5 py-4 text-champagne">{ligne.comptoir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>

          <Reveal className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-champagne/25 p-5">
              <p className="font-medium text-ivoire">Bars personnalisables</p>
              <p className="mt-2 text-sm text-ivoire/65">
                Nos bars existent en noir et en blanc. {personnalisationBars}.
              </p>
            </div>
            <div className="rounded-xl border border-champagne/25 p-5">
              <p className="font-medium text-ivoire">Besoin de plus ?</p>
              <p className="mt-2 text-sm text-ivoire/65">{optionBarSupplementaire}.</p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {Object.values(modelesBars).map((bar) => (
              <Reveal key={bar.nom} className="overflow-hidden rounded-2xl border border-champagne/15 bg-nuit-soft">
                <div className="grid grid-cols-2 gap-px bg-champagne/15">
                  {bar.photos.map((photo) => (
                    <figure key={photo.couleur} className="relative bg-nuit">
                      <img
                        src={photo.src}
                        alt={`${bar.nom} Barman Mobile Group, finition ${photo.couleur.toLowerCase()}`}
                        width={1200}
                        height={900}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <figcaption className="absolute bottom-2 left-2 rounded-full bg-nuit/80 px-3 py-1 text-xs text-ivoire">
                        {photo.couleur}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl text-ivoire">{bar.nom}</h3>
                  <p className="mt-1 text-sm text-champagne">
                    Plateau {bar.plateau} · hauteur {bar.hauteur}
                  </p>
                  <p className="mt-1 text-xs text-ivoire/55">{bar.style}</p>
                  <p className="mt-3 text-sm text-ivoire/65">{bar.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

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
