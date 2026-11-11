# Où on en est (suivi du projet)

_Dernière mise à jour : 11 novembre 2026_

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

## En cours : activer le code par e-mail (Brevo)
- Compte Brevo créé ; expéditeur `bakhoummarcel90@gmail.com` vérifié ; clé API « Sen service
  livraisons » créée (accès restreint, Emails transactionnels = Tous).
- Cette clé a été visible sur des photos : à **régénérer avant l'utilisation réelle**.
- Reste à faire : Railway → Variables → ajouter `BREVO_API_KEY` (la clé, entre guillemets dans le
  Raw Editor), `MAIL_FROM_EMAIL=bakhoummarcel90@gmail.com`, `MAIL_FROM_NAME=Sen Service Livraisons`
  → Update Variables → Deploy → vérifier dans Paramètres : « Vérification par e-mail : activée »
  → faire une inscription test.
- La clé Brevo expire le 10 nov. 2027 ou après 90 jours sans utilisation.

## Ensuite
- Passage en réel : nouveau volume vide, retirer `SEED_DEMO`/`DEMO_PASSWORD`, ajouter `SETUP_CODE`,
  `LEGAL_EDITOR_NAME`, `LEGAL_EDITOR_ADDRESS`, `LEGAL_CONTACT_EMAIL`, créer l'entreprise sur `/installation`.
- Stores : Google Play (PWABuilder, voir `store/PUBLICATION.md`), puis App Store (Mac requis).
- Plus tard : SMS (fournisseur payant), Wave/Orange Money (contrats + clés API), adresse
  personnalisée (ex. livraison.barmanmobile.com).
