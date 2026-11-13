# Où on en est (suivi du projet)

_Dernière mise à jour : 13 novembre 2026_

## En ligne
- Application : https://senservicelivraison.up.railway.app (Railway, dossier `livraisons`, volume `/data`, branche `main`)
- Démo chargée (`SEED_DEMO=1`, mot de passe = variable `DEMO_PASSWORD` dans Railway).
  Comptes : `admin@demo.sn`, `boutique@demo.sn`, livreur `70 000 00 11`.
- Railway : déploiement automatique indisponible → à chaque mise à jour : carte → Settings →
  « Upstream Repo » → **Update** → **Yes** (l'e-mail « déploiement échoué » d'une tentative
  intermédiaire peut être ignoré si la carte repasse « Online »).
- Essai Railway : 30 jours ou 5 $ → choisir une offre avant la fin.

## Fusionné sur main (PR n°1 à n°9)
Application complète, colis internationaux + suivi public `/suivi`, 11 pays, PWA installable,
pages légales (`/confidentialite`, `/suppression-compte`), nouveau commerçant saisi dans la commande,
liens de suivi au nom de la boutique, inscription publique `/inscription` (commerçant/particulier
actifs, livreurs validés par l'admin), notifications admin (cloche + push), code de vérification
par e-mail (Brevo).

## Pull request n°10 : fonctions « livraison à la demande »
Véhicule + prix automatique (grille dans Paramètres), bourse aux courses (« Courses dispo »), livreur
favori, GPS du livreur + carte, lien de suivi par livraison (`/livraison/<jeton>`), note du client,
signature. Pour activer la bourse : Paramètres → Attribution des courses → « Bourse ».
À faire ensuite : plusieurs arrêts, notifications « nouvelle course » aux livreurs, paiement en ligne.

## En cours : activer le code par e-mail (Brevo)
- Compte Brevo créé ; expéditeur `bakhoummarcel90@gmail.com` vérifié ; clé API « Sen service
  livraisons » créée (accès restreint, Emails transactionnels = Tous).
- Cette clé a été visible sur des photos : à **régénérer avant l'utilisation réelle**.
- Reste à faire : Railway → Variables → ajouter `BREVO_API_KEY` (la clé, entre guillemets dans le
  Raw Editor), `MAIL_FROM_EMAIL=bakhoummarcel90@gmail.com`, `MAIL_FROM_NAME=Sen Service Livraisons`
  → Update Variables → Deploy → vérifier dans Paramètres : « Vérification par e-mail : activée »
  → faire une inscription test.
- La clé Brevo expire le 10 nov. 2027 ou après 90 jours sans utilisation.

## En cours : publication sur Google Play (reprise le 14 novembre)
- Décision : publier au nom de **Barman Mobile** (entreprise déclarée) avec un compte **Organisation**
  (pas de règle des 12 testeurs). Nom de développeur saisi : « Barman Mobile ». Nom de l'appli :
  « Sen Service Livraisons ».
- Fait : Gmail de l'entreprise créé ; inscription Play Console commencée (play.google.com/console/signup),
  arrêtée à l'écran « Saisissez un numéro D-U-N-S » (annulé : essais limités, ne rien inventer).
- **Prochaine étape** : sur https://www.dnb.com/fr-ca/smb/duns/duns-lookup.html (cliquer « Required Only »),
  chercher Sénégal + Barman Mobile. Trouvé → reprendre le profil de paiement (pays Sénégal, type
  Organisation, nom/adresse exacts du RCCM) puis payer 25 $. Pas trouvé → demande gratuite sur
  https://www.dnb.com/fr-ca/smb/duns/get-a-duns.html (jusqu'à 30 jours ouvrables). Ne payer aucun intermédiaire.
- Apple : création de l'identifiant Apple échouée → reporté. Compte Apple Organisation demandera
  aussi le D-U-N-S, un site web de l'entreprise et ~99 $/an (paiement après vérification).
- Pendant l'attente : préparer le paquet Android (PWABuilder) et la fiche du store ; passer en réel avant publication.

## Vidéos promotionnelles (13 novembre)
- Vidéo 1 « démonstration » (1 min 17, vertical, sous-titres) et vidéo 2 « publicité » (32 s, musique
  composée, libre de droits) envoyées dans la conversation. Scripts de fabrication dans le dossier
  de travail de la session (non versionnés).

## Ensuite
- Passage en réel : nouveau volume vide, retirer `SEED_DEMO`/`DEMO_PASSWORD`, ajouter `SETUP_CODE`,
  `LEGAL_EDITOR_NAME`, `LEGAL_EDITOR_ADDRESS`, `LEGAL_CONTACT_EMAIL`, créer l'entreprise sur `/installation`.
- Stores : Google Play (PWABuilder, voir `store/PUBLICATION.md`), puis App Store (Mac requis).
- Plus tard : SMS (fournisseur payant), Wave/Orange Money (contrats + clés API), adresse
  personnalisée (ex. livraison.barmanmobile.com).
