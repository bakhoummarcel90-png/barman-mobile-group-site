import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Barman Mobile Group.",
  alternates: { canonical: "/mentions-legales" },
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-3xl space-y-8 text-ivoire/75">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Informations légales</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire">Mentions légales</h1>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Éditeur du site</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Le présent site est édité par {siteConfig.legalName}, entreprise individuelle
            exerçant sous l'enseigne commerciale « Barman Mobile Group », immatriculée au
            Registre du Commerce et du Crédit Mobilier de Dakar sous le numéro
            SN DKR 2019 A 23120.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Siège de l'activité : {siteConfig.contact.address}
            <br />
            Téléphone : {siteConfig.contact.phonePrincipal}
            <br />
            E-mail : {siteConfig.contact.email}
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Hébergement</h2>
          <p className="mt-3 text-sm leading-relaxed">
            À compléter : nom, adresse et contact de l'hébergeur retenu lors du déploiement du
            site (par exemple Vercel Inc.).
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Propriété intellectuelle</h2>
          <p className="mt-3 text-sm leading-relaxed">
            L'ensemble des textes, images, logos et éléments visuels présents sur ce site sont la
            propriété de Barman Mobile Group, sauf mention contraire, et ne peuvent être
            reproduits sans autorisation préalable.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Responsabilité</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Barman Mobile Group s'efforce d'assurer l'exactitude des informations diffusées sur
            ce site. Les tarifs définitifs de nos prestations sont communiqués individuellement
            après étude de chaque demande de devis et ne sauraient être déduits des informations
            générales présentées ici.
          </p>
        </div>
      </div>
    </section>
  );
}
