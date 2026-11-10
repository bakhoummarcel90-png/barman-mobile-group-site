import type { Metadata } from "next";
import Link from "next/link";
import { Configured, LegalPage } from "@/components/LegalPage";
import { legalInfo } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité", robots: { index: true, follow: true } };
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const l = legalInfo();
  return (
    <LegalPage title="Politique de confidentialité" updated="10 novembre 2026">
      <p>
        SenLivraison est une application de gestion des livraisons et des colis utilisée par des entreprises de livraison, leurs livreurs
        et les commerçants qu'elles servent. Cette page explique quelles données sont traitées, pourquoi, et comment exercer vos droits.
      </p>

      <h2>Éditeur et contact</h2>
      <p>
        Éditeur : <Configured value={l.editor} label="nom de l'éditeur" />, <Configured value={l.address} label="adresse" />.
        <br />
        Contact : <Configured value={l.email} label="e-mail de contact" />.
      </p>
      <p>
        Chaque entreprise de livraison qui utilise SenLivraison est responsable des données de ses clients, livreurs et commerçants ;
        l'éditeur les héberge et les traite pour son compte.
      </p>

      <h2>Données traitées</h2>
      <ul>
        <li>Comptes : nom, e-mail et/ou téléphone, rôle, mot de passe (enregistré sous forme chiffrée, jamais en clair).</li>
        <li>Livraisons : nom, téléphone et adresse du client destinataire, indications d'accès, montants, mode de paiement, historique des statuts.</li>
        <li>Preuves de livraison : notes et photos prises par le livreur.</li>
        <li>Encaissements : montants collectés, moyens de paiement, confirmations, remises et reversements.</li>
        <li>Colis internationaux : expéditeur, destinataire, contenu, poids, valeur déclarée, étapes de suivi.</li>
        <li>Données techniques : cookie de session (connexion), dates de connexion.</li>
      </ul>
      <p>
        L'application ne collecte pas la position GPS, ne contient pas de publicité et ne vend aucune donnée. Les boutons WhatsApp, SMS,
        Appel et Itinéraire ouvrent les applications de votre téléphone : SenLivraison n'envoie aucun message à votre place.
      </p>

      <h2>Finalités</h2>
      <ul>
        <li>Organiser et suivre les livraisons et les colis.</li>
        <li>Prouver la remise des colis et rapprocher les montants encaissés.</li>
        <li>Sécuriser l'accès (sessions, limitation des tentatives de connexion).</li>
      </ul>

      <h2>Qui voit quoi</h2>
      <ul>
        <li>Chaque entreprise ne voit que ses propres données.</li>
        <li>Un commerçant ne voit que ses commandes et ses colis ; un livreur, uniquement les livraisons qui lui sont attribuées.</li>
        <li>La page publique de suivi d'un colis n'affiche que les étapes, les villes et les dates, jamais de nom ni de téléphone.</li>
      </ul>

      <h2>Conservation</h2>
      <p>
        Les données sont conservées tant que l'entreprise utilise le service, et le temps nécessaire à ses obligations comptables. Une
        session de connexion expire après 30 jours.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez demander l'accès, la rectification ou la suppression de vos données auprès de l'entreprise de livraison qui vous a créé
        un compte, ou de l'éditeur (<Configured value={l.email} label="e-mail de contact" />). Vous pouvez aussi supprimer vous-même votre
        compte : <Link href="/suppression-compte" className="link">voir la procédure</Link>.
      </p>

      <h2>Sécurité et hébergement</h2>
      <p>
        Les échanges sont chiffrés (HTTPS), les mots de passe sont hachés, et les photos ne sont accessibles qu'aux personnes autorisées à
        voir la livraison concernée.
      </p>
    </LegalPage>
  );
}
