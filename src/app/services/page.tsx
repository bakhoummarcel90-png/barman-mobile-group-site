import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { services } from "@/config/services";
import ServiceCard from "@/components/ServiceCard";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nos services événementiels à Dakar",
  description:
    "Bar mobile, catering, open grill, location de matériel, staffing et expériences : découvrez les six pôles de services de Barman Mobile Group.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Nos services</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
            Six pôles, une seule équipe pour votre événement
          </h1>
          <p className="mt-6 text-ivoire/65">
            Barman Mobile Group a construit son savoir-faire autour du bar mobile, puis l'a
            élargi pour couvrir l'ensemble des besoins d'un événement réussi : restauration,
            location de matériel et personnel qualifié.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delayMs={i * 60}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 rounded-2xl border border-champagne/15 bg-nuit-soft p-8 text-center">
          <h2 className="font-display text-2xl text-ivoire">Un besoin qui combine plusieurs pôles ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ivoire/60">
            La plupart de nos plus belles prestations combinent bar mobile, catering ou open
            grill, matériel et personnel. Parlons-en ensemble.
          </p>
          <Link
            href="/devis"
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-medium text-nuit hover:bg-champagne-light"
          >
            Demander un devis <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
