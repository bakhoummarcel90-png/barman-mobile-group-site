import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité et de protection des données de Barman Mobile Group.",
  alternates: { canonical: "/politique-confidentialite" },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-3xl space-y-8 text-ivoire/75">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Vos données</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire">Politique de confidentialité</h1>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Données collectées</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Lorsque vous remplissez notre formulaire de demande de devis, nous collectons les
            informations que vous nous transmettez volontairement : nom, coordonnées
            téléphoniques et WhatsApp, e-mail, et les détails de votre événement (type, date,
            lieu, nombre d'invités, services souhaités, budget indicatif et message).
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Utilisation des données</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Ces informations sont utilisées exclusivement pour établir et vous transmettre une
            proposition commerciale personnalisée, et pour vous recontacter au sujet de votre
            demande. Elles ne sont ni revendues, ni transmises à des tiers à des fins
            commerciales.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Formulaire et WhatsApp</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Notre formulaire de devis peut générer un message prérempli que vous envoyez
            vous-même vers WhatsApp. Cet envoi est soumis à la politique de confidentialité de
            WhatsApp / Meta pour l'acheminement du message.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Cookies</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Ce site n'utilise pas de cookies publicitaires ou de traçage tiers non essentiels.
            Si des cookies strictement nécessaires au fonctionnement du site venaient à être
            ajoutés, cette page serait mise à jour en conséquence.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-ivoire">Vos droits</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Vous pouvez à tout moment demander l'accès, la rectification ou la suppression des
            données vous concernant en nous contactant à l'adresse {siteConfig.contact.email}.
          </p>
        </div>
      </div>
    </section>
  );
}
