# Où on en est (suivi du projet)

_Dernière mise à jour : 10 novembre 2026 (soir)_

## Fait

- Application SenLivraison complète dans `livraisons/` : commandes, livreurs, commerçants, encaissements,
  tableau de bord, espace livreur mobile.
- En ligne sur Railway (essai gratuit : 30 jours ou 5 $) :
  https://senservicelivraison.up.railway.app (ancienne adresse : barman-mobile-group-site-production.up.railway.app)
  - Démo chargée (`SEED_DEMO=1`). Comptes : `admin@demo.sn`, `boutique@demo.sn`, livreur `70 000 00 11`,
    mot de passe = la valeur de `DEMO_PASSWORD` dans Railway.
  - Railway : dossier racine `livraisons`, volume monté sur `/data`, branche `main`.
- Pull request n°1 fusionnée : l'application.
- Pull request n°2 fusionnée : colis internationaux (`/colis`, suivi public `/suivi`) et 11 pays
  d'Afrique de l'Ouest.

- Pull request n°3 (à fusionner) : application installable (PWA), pages légales exigées par les stores
  (`/confidentialite`, `/suppression-compte`), suppression de compte dans « Mon compte », captures et
  guide de publication : `store/PUBLICATION.md`.

- Pull requests n°3 à n°5 fusionnées : application installable et pages des stores, saisie d'un nouveau
  commerçant dans la commande, liens de suivi au nom de la boutique.
- Décision : une seule entreprise (la vôtre) ; inscription publique avec commerçants/particuliers actifs tout
  de suite et livreurs validés par l'administrateur (pull request n°6).

## Objectif décidé : publier sur Google Play et l'App Store

- Android d'abord (via PWABuilder → fichier `.aab`), puis iPhone (nécessite un Mac et un compte Apple).
- À faire par le propriétaire : compte Google Play Console (frais uniques), compte Apple Developer
  (abonnement annuel), adresse définitive (nom de domaine conseillé), coordonnées légales
  (`LEGAL_EDITOR_NAME`, `LEGAL_EDITOR_ADDRESS`, `LEGAL_CONTACT_EMAIL`), quitter la démo.

## Prochaine étape (à reprendre)

1. **Mettre en ligne la version avec les colis et les pays** : dans Railway → carte
   « barman-mobile-group-site » → Settings → « Check for updates » → Deploy.
   (Le déploiement automatique est indisponible : Railway n'a pas encore l'autorisation GitHub.)
2. Vérifier en ligne : onglet « Colis », les 6 colis de démonstration, la page `/suivi`.
3. Proposé : autoriser l'application Railway sur GitHub pour que chaque mise à jour se déploie
   automatiquement.

## Ensuite (à décider)

- Retours de l'essai de la démo (corrections, ajouts).
- Passage en utilisation réelle : effacer la démo (nouveau volume vide), retirer `SEED_DEMO` et
  `DEMO_PASSWORD`, ajouter `SETUP_CODE`, créer la vraie entreprise sur `/installation`.
- Avant la fin de l'essai Railway : choisir une offre payante pour garder l'application en ligne.
- Plus tard, avec contrats et clés API : Wave / Orange Money, SMS, WhatsApp Business, transporteurs (DHL…).
