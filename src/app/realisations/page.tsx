import type { Metadata } from "next";
import Lightbox from "@/components/Lightbox";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nos réalisations",
  description:
    "Découvrez en images les prestations de Barman Mobile Group : bars mobiles, mariages, réceptions d'entreprise et grands événements au Sénégal.",
  alternates: { canonical: "/realisations" },
};

const galleryItems = [
  { src: "/images/hero-barman-mobile.webp", description: "Préparation de cocktails par Barman Mobile Group lors d'une réception", aspect: "aspect-[3/4]" },
  { src: "/images/gallery/bar-service-smoke.webp", description: "Mise en scène spectaculaire au bar avec les cocktails prêts au service", aspect: "aspect-square" },
  { src: "/images/gallery/cocktail-lineup.webp", description: "Présentation soignée d'une sélection de cocktails colorés", aspect: "aspect-square" },
  { src: "/images/gallery/guest-service.webp", description: "Service personnalisé auprès des invités pendant un événement", aspect: "aspect-[3/4]" },
  { src: "/images/gallery/team-bar.webp", description: "Équipe Barman Mobile Group réunie devant le bar mobile", aspect: "aspect-square" },
  { src: "/images/team-barmen.webp", description: "Barmans BMG en uniforme professionnel", aspect: "aspect-square" },
  { src: "/images/gallery/cocktail-tray.webp", description: "Service de cocktails colorés sur plateau", aspect: "aspect-[3/4]" },
  { src: "/images/gallery/cocktail-orange.webp", description: "Cocktail présenté avec une garniture d'orange", aspect: "aspect-square" },
  { description: "Invités profitant des créations Barman Mobile lors d'une réception", aspect: "aspect-[3/4]" },
  { src: "/images/gallery/outdoor-bar.webp", description: "Bar mobile installé pour une réception en extérieur", aspect: "aspect-[3/4]" },
  { src: "/images/cocktail-blue.webp", description: "Cocktail créatif bleu et vert servi dans une ambiance festive", aspect: "aspect-square" },
  { src: "/images/bar-display.webp", description: "Bar dressé avec cocktails et verrerie prêts pour les invités", aspect: "aspect-square" },
];

export default function RealisationsPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Galerie</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">Nos réalisations</h1>
          <p className="mt-6 text-ivoire/65">
            Plus de 150 prestations réalisées depuis {" "}2019, pour des mariages, des
            entreprises et des institutions. Découvrez quelques images de notre équipe, de nos
            cocktails et de nos prestations sur le terrain.
          </p>
        </Reveal>

        <div className="mt-14">
          <Lightbox items={galleryItems} />
        </div>
      </div>
    </section>
  );
}
