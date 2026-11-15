import type { Metadata } from "next";
import Link from "next/link";
import { Configured, LegalPage } from "@/components/LegalPage";
import { CUSTOMS_NOTE, PROHIBITED_ITEMS } from "@/lib/gp";
import { legalInfo } from "@/lib/legal";

export const metadata: Metadata = { title: "Conditions d'utilisation", robots: { index: true, follow: true } };
export const dynamic = "force-dynamic";

export default function TermsPage() {
  const l = legalInfo();
  return (
    <LegalPage title="Conditions d'utilisation" updated="15 novembre 2026">
      <p>
        Ces conditions s'appliquent à toute personne qui crée un compte ou utilise l'application : expéditeurs (particuliers et commerçants), GP
        (voyageurs qui transportent des colis), livreurs et entreprises de livraison. En créant un compte, vous les acceptez.
      </p>

      <h2>1. Éditeur</h2>
      <p>
        L'application est éditée par <Configured value={l.editor} label="nom de l'éditeur" />, <Configured value={l.address} label="adresse" />.
        Contact : <Configured value={l.email} label="e-mail de contact" />.
      </p>

      <h2>2. Rôle de l'application pour les envois par GP</h2>
      <p>
        Pour les envois par GP, l'application <strong>met en relation</strong> des expéditeurs et des GP. L'éditeur ne transporte pas les colis :
        le transport est assuré par le GP, sous sa responsabilité, selon les conditions convenues avec l'expéditeur. Le prix du transport (prix au
        kilo affiché par le GP) se règle directement entre l'expéditeur et le GP.
      </p>
      <p>
        La mise en relation est gratuite. Si des frais devaient être introduits, ils seraient annoncés à l'avance et affichés clairement avant toute
        réservation.
      </p>

      <h2>3. Comptes</h2>
      <ul>
        <li>Vous fournissez des informations exactes (nom, téléphone) et gardez votre mot de passe secret.</li>
        <li>Les GP et les livreurs ne peuvent agir qu'après vérification de leur identité par l'entreprise.</li>
        <li>Un compte est personnel : il ne peut pas être prêté ou revendu.</li>
      </ul>

      <h2>4. Engagements de l'expéditeur</h2>
      <ul>
        <li>Vous êtes <strong>responsable du contenu de votre colis</strong> et vous en déclarez honnêtement la nature, le poids et la valeur.</li>
        <li>Vous n'envoyez aucun objet interdit (liste ci-dessous) et respectez les règles de douane du pays de départ et du pays d'arrivée.</li>
        <li>Vous acceptez que le GP ouvre et vérifie votre colis devant vous au moment du dépôt, et qu'il le refuse s'il n'est pas conforme.</li>
        <li>Vous emballez correctement votre colis.</li>
      </ul>

      <h2>5. Engagements du GP</h2>
      <ul>
        <li>Vous publiez des voyages réels, avec des dates, des kilos et des prix exacts, et vous tenez l'expéditeur informé de tout changement.</li>
        <li>
          Vous <strong>ouvrez et vérifiez chaque colis</strong> devant l'expéditeur avant de l'accepter, et vous refusez tout colis dont le contenu est
          interdit ou différent de la déclaration.
        </li>
        <li>Vous respectez les règles de douane et de transport aérien, et vous transportez les colis avec soin jusqu'à leur remise au destinataire.</li>
      </ul>

      <h2>6. Objets interdits</h2>
      <ul>
        {PROHIBITED_ITEMS.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <p>{CUSTOMS_NOTE}</p>

      <h2>7. Signalements et sanctions</h2>
      <p>
        Chaque réservation propose un bouton « Signaler un problème ». L'entreprise examine les signalements et peut, sans préavis,{" "}
        <strong>suspendre ou supprimer le compte</strong> de toute personne qui envoie ou transporte des objets interdits, fournit de fausses
        informations ou se comporte de façon frauduleuse. Les faits illégaux peuvent être signalés aux autorités compétentes.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        L'éditeur vérifie l'identité des GP et met à disposition des outils de suivi et de signalement, mais ne contrôle pas lui-même le contenu des
        colis. Il ne peut pas être tenu responsable du contenu d'un colis, d'une saisie en douane, d'un retard, d'une perte ou d'un dommage survenus
        pendant le transport, qui relèvent de la relation entre l'expéditeur et le GP. Aucune assurance n'est incluse.
      </p>

      <h2>9. Données personnelles et suppression du compte</h2>
      <p>
        Le traitement de vos données est décrit dans la{" "}
        <Link href="/confidentialite" className="link">
          politique de confidentialité
        </Link>
        . Vous pouvez{" "}
        <Link href="/suppression-compte" className="link">
          supprimer votre compte
        </Link>{" "}
        à tout moment.
      </p>

      <h2>10. Droit applicable</h2>
      <p>Ces conditions sont régies par le droit sénégalais. Elles peuvent évoluer ; la date de mise à jour figure en haut de cette page.</p>
    </LegalPage>
  );
}
