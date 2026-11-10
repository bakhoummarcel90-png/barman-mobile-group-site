# Publier SenLivraison sur Google Play et l'App Store

L'application est une « application web progressive » (PWA) : installable, plein écran, avec icône,
page hors connexion, politique de confidentialité et suppression de compte. Les stores la reçoivent
sous forme d'**emballage** qui ouvre le site en plein écran :

- **Android** : application « TWA » (Trusted Web Activity), générée gratuitement par PWABuilder.
- **iPhone** : projet Xcode généré par PWABuilder, à compiler sur un Mac.

Les mises à jour de l'application se font sur le site : pas besoin de republier sur les stores
à chaque changement (sauf changement d'icône, de nom ou d'adresse).

## Avant de commencer (à faire une fois)

1. **Adresse définitive** : idéalement un nom de domaine à vous (ex. `app.votreentreprise.com`)
   relié à Railway (Settings → Networking → Custom Domain). L'application des stores est liée à
   cette adresse : en changer plus tard oblige à republier.
2. **Variables chez l'hébergeur** (Railway → Variables) :
   - `LEGAL_EDITOR_NAME`, `LEGAL_EDITOR_ADDRESS`, `LEGAL_CONTACT_EMAIL` : coordonnées affichées
     sur `/confidentialite` et `/suppression-compte` (exigées par les stores) ;
   - quitter la démo : supprimer `SEED_DEMO` et `DEMO_PASSWORD`, repartir d'un volume vide,
     ajouter `SETUP_CODE` (voir README, « Mise en ligne »). Les stores vérifient l'application :
     prévoyez un **compte de test** (identifiant + mot de passe) à leur communiquer.

## Android — Google Play

Coût : compte développeur Google Play, frais d'inscription unique (environ 25 USD), vérification
d'identité. Pour un compte **personnel** récent, Google exige en général un test fermé avec un
groupe de testeurs pendant plusieurs jours avant la mise en production (vérifiez les règles en
vigueur dans la Play Console) ; un compte **organisation** (entreprise) demande un numéro D-U-N-S.

1. Créer le compte sur https://play.google.com/console
2. Aller sur https://www.pwabuilder.com, saisir l'adresse de l'application, puis
   « Package for stores » → **Android** → options :
   - Package ID : par ex. `com.votreentreprise.senlivraison` (définitif) ;
   - nom : SenLivraison ; couleur : `#0b8a6b`.
   Télécharger le paquet : il contient le fichier `.aab` à envoyer sur Google Play, **la clé de
   signature (à conserver précieusement, hors de GitHub)** et un fichier `assetlinks.json`.
3. Dans Railway → Variables, ajouter :
   - `ANDROID_PACKAGE_NAME` = le Package ID choisi ;
   - `ANDROID_SHA256_FINGERPRINTS` = l'empreinte SHA-256 indiquée dans `assetlinks.json`.
     Après le premier envoi sur Google Play, ajouter aussi (séparée par une virgule) l'empreinte
     de **Play Console → Intégrité de l'application → Signature d'application**.
   Vérifier : `https://VOTRE-ADRESSE/.well-known/assetlinks.json` doit afficher ces valeurs.
   Sans cela, l'application s'ouvre avec une barre d'adresse au lieu du plein écran.
4. Play Console → Créer une application → remplir la fiche (textes ci-dessous), envoyer le `.aab`
   en test interne, puis test fermé, puis production.

## iPhone — App Store

Coût : Apple Developer Program, abonnement annuel (environ 99 USD). Il faut **un Mac avec Xcode**
(ou un service de Mac en ligne) pour compiler et envoyer l'application.

1. Créer le compte sur https://developer.apple.com/programs/
2. PWABuilder → « Package for stores » → **iOS** : télécharger le projet Xcode.
3. Sur un Mac : ouvrir le projet, choisir l'équipe Apple, compiler, envoyer via Xcode
   (Product → Archive → Distribute), puis compléter la fiche dans App Store Connect.

Attention : Apple refuse les applications qui se contentent d'afficher un site (règle 4.2,
« fonctionnalité minimale »). SenLivraison est un outil métier avec comptes, photo de preuve,
suivi et encaissements, ce qui joue en sa faveur, mais l'acceptation n'est pas garantie.
Si Apple refuse, l'alternative est l'installation sur iPhone depuis Safari
(Partager → « Sur l'écran d'accueil »), qui fonctionne déjà.

## Fiche du store (textes à copier)

**Nom** : SenLivraison

**Description courte** (80 caractères max.) :
Livraisons, livreurs, encaissements et colis internationaux en Afrique de l'Ouest

**Description complète** :
SenLivraison aide les entreprises de livraison et les commerces en ligne d'Afrique de l'Ouest
à gérer leurs livraisons au quotidien.

• Commandes : créez et suivez chaque livraison, de l'attribution au livreur jusqu'à la remise.
• Espace livreur : courses du jour, coordonnées du client, appel, WhatsApp et itinéraire en un
  geste, confirmation de livraison avec le montant encaissé et une photo de preuve.
• Encaissements : espèces, Wave, Orange Money, MTN MoMo, Moov Money… saisis par le livreur,
  vérifiés par l'entreprise, avec les montants à reverser à chaque commerçant.
• Colis internationaux : suivez les colis venant d'Europe, de Chine ou des États-Unis (et
  inversement), et donnez à vos clients une page de suivi simple.
• Commerçants : suivez vos commandes et les paiements qui vous sont dus.
• 11 pays configurés : Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Bénin, Togo, Niger, Guinée,
  Ghana, Nigeria, Gambie.

Chaque entreprise ne voit que ses données ; chaque commerçant et chaque livreur ne voit que
ce qui le concerne.

**Catégorie** : Entreprise (Business)

**Captures d'écran** (1080 × 1920) : dossier `store/captures/`.

**Icône 512 × 512** : `public/icons/icon-512.png`.

**URL de confidentialité** : `https://VOTRE-ADRESSE/confidentialite`

**URL de suppression de compte** : `https://VOTRE-ADRESSE/suppression-compte`

## Formulaire « Sécurité des données » (Google Play) — proposition à vérifier

- Données collectées : nom, e-mail, téléphone (compte) ; adresse et téléphone des clients
  destinataires ; photos (preuve de livraison) ; informations financières : montants encaissés
  (pas de numéro de carte) ; identifiants de session.
- Partage avec des tiers : non (hors hébergeur, qui agit pour le compte de l'éditeur).
- Chiffrement en transit : oui (HTTPS).
- Suppression : oui, depuis l'application (Mon compte) ou sur demande (page de suppression).
- Publicité : aucune. Localisation : non collectée.
