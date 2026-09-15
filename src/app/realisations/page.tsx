import type { Metadata } from "next";
import Lightbox from "@/components/Lightbox";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Nos réalisations",
  description:
    "Découvrez en images les prestations de Barman Mobile Group : bars mobiles, mariages, réceptions d'entreprise et grands événements au Sénégal.",
  alternates: { canonical: "/realisations" },
};

const galleryPlaceholders = [
  "Bar mobile installé lors d'un mariage en extérieur, à Dakar",
  "Cocktail signature préparé par un barman BMG",
  "Équipe de service en uniforme lors d'une réception d'entreprise",
  "Table de buffet dressée avec verrerie premium",
  "Rôtisserie Open Grill en action lors d'un grand événement",
  "Bar mobile éclairé le soir, ambiance festive",
  "Détail de verrerie et matériel de bar pour un mariage",
  "Grand événement institutionnel pris en charge par BMG",
  "Atelier cocktails animé pour des invités",
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
            entreprises et des institutions. Cette galerie sera enrichie au fur et à mesure de
            vos retours photo — chaque emplacement ci-dessous est prêt à recevoir une vraie
            image de vos événements.
          </p>
        </Reveal>

        <div className="mt-14">
          <Lightbox
            items={galleryPlaceholders.map((desc, i) => ({
              description: desc,
              aspect: i % 3 === 0 ? "aspect-[3/4]" : "aspect-square",
            }))}
          />
        </div>
      </div>
    </section>
  );
}
