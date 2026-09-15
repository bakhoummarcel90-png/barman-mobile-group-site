import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import PlaceholderImage from "@/components/PlaceholderImage";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Notre histoire",
  description:
    "L'histoire de Marcel Bakhoum, fondateur de Barman Mobile Group : du terrain à l'European Bartender School de Paris, un parcours de persévérance et de professionnalisme.",
  alternates: { canonical: "/notre-histoire" },
};

export default function NotreHistoirePage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Notre histoire</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
            L'histoire d'{siteConfig.founder}
          </h1>
        </Reveal>

        <Reveal className="mt-10">
          <PlaceholderImage
            description="Marcel Bakhoum en service au bar lors d'une réception"
            src="/images/bartender-service.webp"
            aspect="aspect-[16/9]"
          />
        </Reveal>

        <Reveal delayMs={100} className="mt-10 max-w-none space-y-6 text-ivoire/75">
          <p>
            Avant de fonder Barman Mobile, {siteConfig.founder} a connu un parcours personnel
            exigeant. C'est dans cette période qu'il découvre l'univers de la restauration et du
            bar, un monde où il trouve à la fois un métier et une véritable vocation.
          </p>
          <p>
            Il commence par apprendre sur le terrain, poste après poste, événement après
            événement. Avec persévérance, il gravit les échelons jusqu'à devenir chef barman,
            se formant en grande partie de manière autonome, au contact direct des clients et
            des exigences du métier.
          </p>
          <p>
            Fort de cette expérience de terrain, il décide d'investir ses économies dans son
            premier bar mobile. Barman Mobile naît de cette conviction simple : rapprocher le
            service professionnel des clients, et rendre les expériences premium accessibles
            lors des événements au Sénégal.
          </p>
          <p>
            Pour consolider cette ambition, {siteConfig.founder} renforce ensuite son expertise
            par une formation professionnelle à l'European Bartender School de Paris — une étape
            qui vient structurer un savoir-faire déjà solide, acquis sur le terrain.
          </p>
          <p>
            Depuis, Barman Mobile est devenu Barman Mobile Group, porté par la même exigence :
            construire, événement après événement, une entreprise sénégalaise capable de
            rivaliser avec les meilleurs standards internationaux.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
