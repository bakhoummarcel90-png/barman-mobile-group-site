import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { services } from "@/config/services";
import PlaceholderImage from "@/components/PlaceholderImage";
import ServiceCard from "@/components/ServiceCard";
import RentalCatalog from "@/components/RentalCatalog";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) return {};
  return {
    title: service.fullName,
    description: service.intro,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) return notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <section className="px-5 pb-16 pt-36">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">{service.tagline}</p>
            <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">{service.fullName}</h1>
            <p className="mt-6 text-ivoire/65">{service.intro}</p>
            <p className="mt-4 text-sm text-ivoire/50">Idéal pour : {service.forWho}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/devis"
                className="focus-ring inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-3 text-sm font-medium text-nuit hover:bg-champagne-light"
              >
                Demander un devis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-ivoire/25 px-6 py-3 text-sm text-ivoire hover:border-ivoire/60"
              >
                Tous nos services
              </Link>
            </div>
          </Reveal>
          <Reveal>
            <PlaceholderImage description={service.heroPlaceholder} aspect="aspect-[4/3]" />
          </Reveal>
        </div>
      </section>

      <section className="bg-nuit-soft px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="font-display text-2xl text-ivoire md:text-3xl">Ce que comprend ce service</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {service.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-ivoire/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {service.slug === "location-materiel" && (
        <section className="bg-nuit-soft px-5 py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="font-display text-2xl text-ivoire md:text-3xl">Notre catalogue</h2>
              <p className="mt-3 text-sm text-ivoire/60">
                Filtrez par catégorie. Les tarifs affichés « Sur devis » dépendent de la
                quantité et de la durée de location.
              </p>
            </Reveal>
            <div className="mt-8">
              <RentalCatalog />
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="font-display text-2xl text-ivoire md:text-3xl">Découvrir aussi</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
