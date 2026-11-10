import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui";
import { Configured, LegalPage } from "@/components/LegalPage";
import { legalInfo } from "@/lib/legal";

export const metadata: Metadata = { title: "Supprimer son compte", robots: { index: true, follow: true } };
export const dynamic = "force-dynamic";

/** Page publique exigée par Google Play : comment demander la suppression de son compte. */
export default async function DeleteAccountInfoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const done = (await searchParams).ok === "1";
  const l = legalInfo();
  return (
    <LegalPage title="Supprimer son compte SenLivraison" updated="10 novembre 2026">
      {done ? <Alert tone="success">Votre compte a été supprimé et vous avez été déconnecté.</Alert> : null}
      <h2>Depuis l'application</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Connectez-vous à SenLivraison.</li>
        <li>
          Ouvrez <strong>Mon compte</strong> (menu ☰ sur téléphone).
        </li>
        <li>
          Dans <strong>Supprimer mon compte</strong>, saisissez votre mot de passe, tapez SUPPRIMER puis confirmez.
        </li>
      </ol>
      <h2>Sans accès à l'application</h2>
      <p>
        Écrivez à <Configured value={l.email} label="e-mail de contact" /> depuis l'adresse ou en indiquant le numéro de téléphone associé à
        votre compte, ou demandez-le à l'administrateur de votre entreprise de livraison. La demande est traitée sous 30 jours.
      </p>
      <h2>Ce qui est supprimé</h2>
      <ul>
        <li>Votre nom, votre e-mail, votre téléphone et votre mot de passe : effacés définitivement.</li>
        <li>Vos sessions de connexion : fermées sur tous vos appareils.</li>
      </ul>
      <h2>Ce qui est conservé</h2>
      <p>
        L'historique des livraisons et des encaissements reste dans les registres de l'entreprise de livraison (obligations comptables),
        rattaché à « Compte supprimé », sans vos coordonnées.
      </p>
      <p>
        <Link href="/confidentialite" className="link">
          Politique de confidentialité
        </Link>
      </p>
    </LegalPage>
  );
}
