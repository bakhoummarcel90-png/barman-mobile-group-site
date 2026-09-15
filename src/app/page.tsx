import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Wine, UtensilsCrossed, Flame, PackageSearch, Users, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { services, methodeDeTravail, pourquoiNousChoisir } from "@/config/services";
import { formules } from "@/config/pricing";
import { typesEvenements } from "@/config/faq";
import ServiceCard from "@/components/ServiceCard";
import FormuleCard from "@/components/FormuleCard";
import StatsCounters from "@/components/StatsCounters";
import PlaceholderImage from "@/components/PlaceholderImage";
import WhatsAppButton from "@/components/WhatsAppButton";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Bar mobile, cocktails et événementiel premium à Dakar",
  description:
    "Bar mobile, cocktails, catering, open grill, location de matériel et personnel événementiel : Barman Mobile Group réunit tout ce dont vous avez besoin pour une réception réussie à Dakar et partout au Sénégal.",
  alternates: { canonical: "/" },
};

const icons = [Wine, UtensilsCrossed, Flame, PackageSearch, Users, Sparkles];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-nuit">
        <div className="absolute inset-0">
          <PlaceholderImage
            description="Bar mobile élégant et éclairé pendant un mariage premium au Sénégal, plan large en soirée"
            className="h-full rounded-none border-none"
            aspect="aspect-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/70 to-nuit/20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-40">
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">
            {siteConfig.slogan}
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl leading-tight text-ivoire md:text-6xl">
            Transformez votre événement en une expérience inoubliable
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ivoire/75 md:text-lg">
            Bar mobile, cocktails, catering, open grill, location et personnel événementiel :
            Barman Mobile Group réunit tout ce dont vous avez besoin pour une réception
            parfaitement organisée.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/devis"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-champagne px-7 py-3.5 text-sm font-medium text-nuit transition-colors hover:bg-champagne-light"
            >
              Demander un devis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-ivoire/25 px-7 py-3.5 text-sm font-medium text-ivoire transition-colors hover:border-ivoire/60"
            >
              Découvrir nos services
            </Link>
            <WhatsAppButton />
          </div>
        </div>
      </section>

      {/* PRÉSENTATION COURTE */}
      <section className="bg-nuit px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">
              Une entreprise événementielle intégrée, née à Dakar
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ivoire/70">
              Depuis {siteConfig.foundingYear}, Barman Mobile s'est imposé comme une référence
              du bar mobile au Sénégal. L'entreprise est aujourd'hui devenue Barman Mobile
              Group : une organisation capable de prendre en charge le bar, la restauration, la
              location de matériel et le personnel de votre événement, avec un seul
              interlocuteur et un seul niveau d'exigence.
            </p>
          </Reveal>
        </div>
      </section>

      {/* LES 6 PÔLES */}
      <section className="bg-nuit-soft px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">Nos pôles de services</h2>
            <p className="mt-4 text-ivoire/60">
              Six expertises, une seule équipe. Combinez-les selon les besoins de votre
              événement.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.slug} delayMs={i * 60}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS CHOISIR */}
      <section className="bg-nuit px-5 py-24">
        <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <PlaceholderImage description="Barman professionnel préparant un cocktail avec soin, en gros plan" aspect="aspect-[4/5]" />
          </Reveal>
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">
              Pourquoi choisir Barman Mobile Group ?
            </h2>
            <ul className="mt-8 space-y-4">
              {pourquoiNousChoisir.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* CHIFFRES CLÉS */}
      <section className="bg-nuit-light px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <StatsCounters />
        </div>
      </section>

      {/* FORMULES RECOMMANDÉES */}
      <section className="bg-nuit-soft px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">Nos formules</h2>
            <p className="mt-4 text-ivoire/60">
              Chaque formule s'adapte à votre événement. Le tarif final dépend de vos critères
              et vous est communiqué sur devis.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {formules.slice(0, 3).map((formule, i) => (
              <Reveal key={formule.slug} delayMs={i * 80}>
                <FormuleCard formule={formule} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/formules" className="focus-ring text-sm text-champagne hover:underline">
              Voir toutes nos formules →
            </Link>
          </div>
        </div>
      </section>

      {/* GALERIE IMMERSIVE (aperçu) */}
      <section className="bg-nuit px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">Nos réalisations</h2>
            <p className="mt-4 text-ivoire/60">Un aperçu de nos prestations sur le terrain.</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "Bar mobile installé pour une réception d'entreprise",
              "Cocktail signature servi lors d'un mariage",
              "Équipe BMG en service lors d'une grande réception",
              "Table de buffet dressée avec élégance",
            ].map((desc, i) => (
              <Reveal key={desc} delayMs={i * 60}>
                <PlaceholderImage description={desc} aspect="aspect-square" />
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/realisations" className="focus-ring text-sm text-champagne hover:underline">
              Voir toute la galerie →
            </Link>
          </div>
        </div>
      </section>

      {/* TYPES D'ÉVÉNEMENTS */}
      <section className="bg-nuit-soft px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-2xl text-ivoire md:text-3xl">
              Des événements de toute taille
            </h2>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-3">
            {typesEvenements.map((type) => (
              <span
                key={type}
                className="rounded-full border border-champagne/20 px-4 py-2 text-sm text-ivoire/75"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* RÉFÉRENCES */}
      <section className="bg-nuit px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-2xl text-ivoire md:text-3xl">
              Ils nous ont fait confiance
            </h2>
            <p className="mt-3 max-w-xl text-sm text-ivoire/55">
              Quelques expériences et structures auprès desquelles Barman Mobile Group est
              intervenu.
            </p>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {siteConfig.references.map((ref) => (
              <span key={ref} className="font-display text-lg text-ivoire/50">
                {ref}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* MÉTHODE DE TRAVAIL */}
      <section className="bg-nuit-soft px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-xl">
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">Notre méthode</h2>
            <p className="mt-4 text-ivoire/60">Un parcours simple, du premier échange au rangement final.</p>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {methodeDeTravail.map((step, i) => (
              <Reveal key={step.title} delayMs={i * 80}>
                <div>
                  <span className="font-display text-3xl text-champagne/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-lg text-ivoire">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivoire/60">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-nuit px-5 py-28 text-center">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="font-display text-3xl text-ivoire md:text-4xl">
              Parlons de votre événement
            </h2>
            <p className="mt-5 text-ivoire/65">
              Un projet de mariage, une réception d'entreprise ou un grand événement institutionnel :
              construisons ensemble une prestation à la hauteur de votre ambition.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/devis"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-champagne px-7 py-3.5 text-sm font-medium text-nuit transition-colors hover:bg-champagne-light"
              >
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
              <WhatsAppButton />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
