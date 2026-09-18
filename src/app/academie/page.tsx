import type { Metadata } from "next";
import Link from "next/link";
import { Check, BookOpen, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  manuelConfig,
  manuelPersonas,
  manuelOutcomes,
  manuelLevels,
  manuelRecipeSheetContents,
  manuelMaterial,
  manuelReceives,
  manuelFaq,
} from "@/config/manuel";
import { ebookConfig, ebookPersonas, ebookOutcomes, ebookReceives, ebookFaq } from "@/config/ebook";
import { upcomingOfferings } from "@/config/academie";
import PlaceholderImage from "@/components/PlaceholderImage";
import FaqAccordion from "@/components/FaqAccordion";
import Reveal from "@/components/Reveal";

const PAGE_URL = "/academie";
const TITLE = "Académie — Manuel, formation et kits du barman | Barman Mobile Group";
const DESCRIPTION =
  "L'Académie Barman Mobile Group : le manuel professionnel du barman, le guide pour créer et rentabiliser un bar mobile, et bientôt une formation en ligne et des kits professionnels.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

function BuyButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "outline";
}) {
  if (!href) {
    return (
      <span
        className="focus-ring inline-flex cursor-not-allowed items-center justify-center rounded-full bg-champagne/30 px-7 py-3.5 text-sm font-medium text-nuit/60"
        aria-disabled="true"
      >
        Bientôt disponible
      </span>
    );
  }

  const base =
    variant === "outline"
      ? "border border-champagne/40 text-ivoire hover:border-champagne hover:bg-champagne/10"
      : "bg-champagne text-nuit hover:bg-champagne-light";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`focus-ring inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-medium transition-colors ${base}`}
    >
      {label}
    </Link>
  );
}

const quickNav = [
  { href: "#manuel", label: "Manuel" },
  { href: "#ebook", label: "eBook" },
  ...upcomingOfferings.map((o) => ({ href: `#${o.id}`, label: o.navLabel })),
];

export default function AcademiePage() {
  return (
    <>
      {/* Intro + navigation rapide */}
      <section className="px-5 pb-10 pt-36">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Académie</p>
            <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
              Académie Barman Mobile Group
            </h1>
            <p className="mt-6 text-ivoire/65">
              Manuels, formations et matériel pour progresser dans le métier de barman et dans la
              gestion de votre activité de bar mobile.
            </p>
          </Reveal>
          <Reveal className="mt-8 flex flex-wrap gap-3">
            {quickNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="focus-ring rounded-full border border-champagne/30 px-5 py-2 text-sm text-ivoire/80 hover:border-champagne hover:text-champagne"
              >
                {item.label}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ==================== RUBRIQUE 1 : MANUEL ==================== */}
      <section id="manuel" className="scroll-mt-24 border-t border-champagne/10 bg-nuit-soft px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">
                Académie Barman Mobile
              </p>
              <h2 className="mt-4 font-display text-3xl text-ivoire md:text-4xl">
                Le manuel complet du barman professionnel
              </h2>
              <p className="mt-6 text-ivoire/65">
                Les techniques, les standards et les méthodes de gestion qui transforment un
                passionné en professionnel fiable et rentable.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ivoire/60">
                <span className="rounded-full border border-champagne/20 px-3 py-1">
                  PDF téléchargeable
                </span>
                <span className="rounded-full border border-champagne/20 px-3 py-1">
                  {manuelConfig.pages} pages
                </span>
                <span className="rounded-full border border-champagne/20 px-3 py-1">
                  {manuelConfig.recipeSheets} cocktails
                </span>
              </div>

              <p className="mt-6 font-display text-2xl text-champagne">
                {manuelConfig.priceFCFA
                  ? `${manuelConfig.priceFCFA.toLocaleString("fr-FR")} FCFA`
                  : "Prix à venir"}
              </p>
              <p className="mt-1 text-xs text-ivoire/50">
                Paiement sécurisé et livraison numérique via Selar.
              </p>

              <div className="mt-7">
                <BuyButton href={manuelConfig.selarUrl} label="Acheter le manuel" />
              </div>
            </Reveal>

            <Reveal>
              <PlaceholderImage
                description="Couverture du manuel Académie Barman Mobile"
                src={manuelConfig.coverImage.src || undefined}
                aspect="aspect-[4/5]"
              />
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <h3 className="font-display text-2xl text-ivoire">À qui s'adresse ce manuel ?</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {manuelPersonas.map((persona) => (
                <div key={persona} className="rounded-2xl border border-champagne/15 bg-nuit-light p-5">
                  <p className="text-sm text-ivoire/80">{persona}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-ivoire">Ce que vous allez apprendre</h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {manuelOutcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {outcome}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-ivoire">Une progression en trois niveaux</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {manuelLevels.map((level) => (
                <div key={level.name} className="rounded-2xl border border-champagne/15 bg-nuit-light p-7">
                  <h4 className="font-display text-lg text-ivoire">{level.name}</h4>
                  <p className="mt-3 text-sm text-ivoire/65">{level.description}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-ivoire">
              {manuelConfig.recipeSheets} fiches cocktails standardisées
            </h3>
            <p className="mt-3 text-sm text-ivoire/65">
              Chaque fiche est construite pour reproduire un cocktail de façon constante, quel
              que soit le barman derrière le bar.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {manuelRecipeSheetContents.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-ivoire">Matériel et pratique</h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {manuelMaterial.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ivoire/45">
              Les Kits Starter et Professionnel présentés dans le manuel ne sont pas inclus dans
              l'achat et correspondent à la rubrique "Kits professionnels" ci-dessous.
            </p>
          </Reveal>

          <Reveal className="mt-14 max-w-3xl">
            <h3 className="font-display text-2xl text-ivoire">Ce que vous recevez</h3>
            <ul className="mt-6 space-y-3">
              {manuelReceives.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14 max-w-3xl">
            <h3 className="font-display text-2xl text-ivoire">Questions fréquentes — Manuel</h3>
            <div className="mt-6">
              <FaqAccordion items={manuelFaq} />
            </div>
          </Reveal>

          <div className="mt-12 flex justify-center">
            <BuyButton href={manuelConfig.selarUrl} label="Acheter le manuel" />
          </div>
        </div>
      </section>

      {/* ==================== RUBRIQUE 2 : EBOOK ==================== */}
      <section id="ebook" className="scroll-mt-24 border-t border-champagne/10 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">
                Barman Mobile Group
              </p>
              <h2 className="mt-4 font-display text-3xl text-ivoire md:text-4xl">
                Créer et rentabiliser un bar mobile en Afrique francophone
              </h2>
              <p className="mt-6 text-ivoire/65">
                Le guide pratique pour transformer votre passion en activité rentable :
                structurer votre offre, fixer vos tarifs, trouver vos clients et organiser vos
                prestations.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ivoire/60">
                <span className="rounded-full border border-champagne/20 px-3 py-1">
                  PDF téléchargeable
                </span>
                <span className="rounded-full border border-champagne/20 px-3 py-1">
                  {ebookConfig.pages} pages
                </span>
              </div>

              <p className="mt-6 text-sm text-ivoire/60">
                Tarif indiqué sur la page Selar du produit.
              </p>
              <p className="mt-1 text-xs text-ivoire/50">
                Paiement sécurisé et livraison numérique via Selar.
              </p>

              <div className="mt-7">
                <BuyButton href={ebookConfig.selarUrl} label="Acheter l'eBook" />
              </div>
            </Reveal>

            <Reveal>
              <PlaceholderImage
                description="Couverture de l'eBook Créer et rentabiliser un bar mobile"
                src={ebookConfig.coverImage.src || undefined}
                aspect="aspect-[4/5]"
              />
            </Reveal>
          </div>

          <Reveal className="mt-16">
            <h3 className="font-display text-2xl text-ivoire">À qui s'adresse ce guide ?</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ebookPersonas.map((persona) => (
                <div key={persona} className="rounded-2xl border border-champagne/15 bg-nuit-light p-5">
                  <p className="text-sm text-ivoire/80">{persona}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-14">
            <h3 className="font-display text-2xl text-ivoire">Ce que vous allez apprendre</h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {ebookOutcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {outcome}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14 max-w-3xl">
            <h3 className="font-display text-2xl text-ivoire">Ce que vous recevez</h3>
            <ul className="mt-6 space-y-3">
              {ebookReceives.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="mt-14 max-w-3xl">
            <h3 className="font-display text-2xl text-ivoire">Questions fréquentes — eBook</h3>
            <div className="mt-6">
              <FaqAccordion items={ebookFaq} />
            </div>
          </Reveal>

          <div className="mt-12 flex justify-center">
            <BuyButton href={ebookConfig.selarUrl} label="Acheter l'eBook" />
          </div>
        </div>
      </section>

      {/* ==================== RUBRIQUES À VENIR ==================== */}
      {upcomingOfferings.map((offering) => (
        <section
          key={offering.id}
          id={offering.id}
          className="scroll-mt-24 border-t border-champagne/10 bg-nuit-soft px-5 py-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-champagne/30 px-4 py-1.5 text-xs uppercase tracking-wide text-champagne">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {offering.status}
              </span>
              <h2 className="mt-5 font-display text-3xl text-ivoire md:text-4xl">
                {offering.title}
              </h2>
              <p className="mt-4 text-ivoire/65">{offering.description}</p>
            </Reveal>
          </div>
        </section>
      ))}

      {/* ==================== AUTEUR (partagé) ==================== */}
      <section className="border-t border-champagne/10 px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_2fr] lg:items-center">
          <Reveal>
            <PlaceholderImage
              description="Marcel Guirane Bakhoum, auteur de l'Académie Barman Mobile"
              src="/images/manuel-auteur.webp"
              aspect="aspect-[4/5]"
            />
          </Reveal>
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire">L'auteur</h2>
            <p className="mt-4 text-ivoire/65">
              Barman Mobile a été fondé à Dakar en {siteConfig.foundingYear} par{" "}
              {siteConfig.founder}, barman professionnel formé notamment à l'European Bartender
              School de Paris. Fort de plus de {siteConfig.stats[1].value}
              {siteConfig.stats[1].suffix} prestations réalisées, il partage à travers l'Académie
              aussi bien les méthodes techniques du métier que celles de la gestion d'une
              activité rentable.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-nuit-soft px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">
              Progressez à votre rythme, sur le métier ou sur votre activité.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <BuyButton href={manuelConfig.selarUrl} label="Acheter le manuel" />
              <BuyButton href={ebookConfig.selarUrl} label="Acheter l'eBook" variant="outline" />
            </div>
            <p className="mt-10 font-display text-lg text-champagne">{siteConfig.name}</p>
            <p className="mt-1 text-sm text-ivoire/60">« {siteConfig.slogan} ! »</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
