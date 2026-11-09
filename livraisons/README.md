# SenLivraison — gestion des livraisons (Sénégal)

Application web (pensée d'abord pour le téléphone) qui permet à une entreprise de
livraison et aux commerçants en ligne qu'elle sert de :

- transmettre des commandes à un livreur et suivre leur progression ;
- confirmer la remise au client (montant encaissé, note, photo) ;
- rapprocher les montants encaissés : vérification, remise des livreurs, reversement aux commerçants.

Interface en français, montants en **franc CFA (FCFA)**, paiements **Espèces, Wave, Orange Money**
(saisie et confirmation **manuelles** dans cette version).

> Ce dossier est une application autonome : il est indépendant du site vitrine
> situé à la racine du dépôt (dépendances, build et déploiement séparés).

## Stack

| Élément | Choix | Pourquoi |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Même stack que le site vitrine du dépôt |
| Style | Tailwind CSS 3 | Idem, interface responsive rapide |
| Base de données | SQLite via `node:sqlite` (intégré à Node) | Aucun serveur ni module natif à compiler : un seul fichier, lancement immédiat |
| Authentification | Sessions en base + cookie `httpOnly`, mots de passe hachés (scrypt) | Aucune dépendance externe, aucun secret à configurer |

## Démarrage

Prérequis : **Node.js 22.13 ou plus récent** (pour `node:sqlite`).

```bash
cd livraisons
npm install
npm run seed      # crée la base ./data/app.db avec les données de démonstration
npm run dev       # http://localhost:3001
```

Production : `npm run build` puis `npm start` (port 3001).

### Compte de démonstration

`npm run seed` crée l'entreprise « Dakar Express Livraison » (4 commerçants, 4 livreurs dont un
désactivé, ~26 commandes dans tous les statuts, des remises et reversements passés).

| Rôle | Identifiant |
| --- | --- |
| Administrateur | `admin@demo.sn` |
| Commerçant (Keur Sokhna Wax) | `boutique@demo.sn` |
| Livreur (Moussa Diop) | `70 000 00 11` (connexion par téléphone) |

**Mot de passe** : aucun mot de passe n'est écrit dans le code. Le script en génère un au hasard
et l'**affiche dans le terminal**. Pour choisir le vôtre :

```bash
DEMO_PASSWORD=mon-mot-de-passe npm run seed
npm run seed -- --reset    # efface TOUTES les données puis recrée la démonstration
```

Les numéros de téléphone de la démonstration (70 000 …) sont fictifs : n'envoyez pas de
messages WhatsApp/SMS de test vers eux. Pour masquer le rappel des comptes de démonstration
sur la page de connexion : `HIDE_DEMO_HINT=1`.

### Variables d'environnement (toutes facultatives)

Voir `.env.example`.

| Variable | Rôle |
| --- | --- |
| `DATA_DIR` | Dossier de la base SQLite et des photos (défaut : `./data`) |
| `DEMO_PASSWORD` | Mot de passe des comptes créés par `npm run seed` |
| `SETUP_CODE` | Code exigé sur la page /installation (recommandé en ligne) |
| `HIDE_DEMO_HINT=1` | Masque l'encadré « comptes de démonstration » |
| `INSECURE_COOKIES=1` | Uniquement pour tester `npm start` depuis un téléphone sur le réseau local en HTTP (en production, servez l'application en HTTPS) |

## Rôles et accès

- **Administrateur** : tout ce qui concerne son entreprise — commandes, attribution, livreurs,
  commerçants, encaissements, exports, administrateurs.
- **Commerçant** : crée, modifie (tant que la course n'a pas démarré), annule et suit **ses**
  commandes ; consulte ce qui lui est dû et les reversements reçus.
- **Livreur** : voit **uniquement les livraisons qui lui sont attribuées** ; démarre la course,
  confirme la livraison (montant encaissé, moyen de paiement, note, photo) ou signale un échec.

L'isolation est appliquée côté serveur sur chaque requête (`src/lib/scope.ts`) :
chaque table porte `company_id`, et les filtres commerçant/livreur sont ajoutés systématiquement.
Les photos de preuve ne sont pas publiques : elles sont servies par `/api/photos/[id]` après
vérification des droits.

## Pages

| Page | Contenu |
| --- | --- |
| `/connexion` | Connexion par e-mail ou téléphone |
| `/tableau-de-bord` | Compteurs (à attribuer, en cours, livrées, échecs), argent à reverser, actions à effectuer, derniers événements ; filtres période / commerçant / livreur |
| `/commandes` | Liste filtrable (période, commerçant, livreur, statut, paiement, recherche), export CSV ; historique pour le livreur |
| `/commandes/nouvelle`, `/commandes/[id]/modifier` | Formulaire avec validation |
| `/commandes/[id]` | Détail : client, contacts, actions selon le rôle, encaissement, historique des statuts |
| `/livraisons` | Admin : répartition (à attribuer, en retard, échecs, courses par livreur). Commerçant : suivi. Livreur : sa journée |
| `/livreurs`, `/commercants` | Gestion des comptes, activation/désactivation, nouveau mot de passe, activité |
| `/encaissements` | Vérification, montants à remettre par livreur, à reverser par commerçant, historique, exports CSV |
| `/parametres` | Entreprise, administrateurs, état des intégrations |
| `/mon-compte` | Changement de mot de passe, déconnexion |

## Statuts

Livraison : **À attribuer → Attribuée → En cours → Livrée**, ou **En cours → Échec de livraison →
Retour au commerçant** (ou nouvelle tentative), et **Annulée** avant le départ du livreur.
Les transitions autorisées par rôle sont définies dans `src/lib/constants.ts` ; chaque changement
est enregistré (date, heure, utilisateur) dans la table `events`.

Paiement : **Non encaissé**, **À vérifier** (saisi par le livreur), **Écart constaté**
(automatique si le montant collecté diffère du montant attendu, ou signalé par l'administrateur),
**Confirmé** (avec la personne et la date de confirmation).

### Règles de rapprochement

- **À remettre par le livreur** = montants encaissés des livraisons livrées, pas encore remis à la caisse.
- **À reverser au commerçant** = encaissements **confirmés** − frais de livraison, pas encore reversés.
  Un solde négatif signifie que le commerçant doit des frais (commandes déjà payées).
- Enregistrer une remise ou un reversement verrouille les livraisons concernées (plus de modification du montant).

## Schéma de données

Défini dans `src/lib/db.ts` (créé automatiquement au premier lancement) :

- `companies` — entreprise de livraison (pays, devise, fuseau horaire)
- `merchants` — boutiques clientes (coordonnées, moyen et numéro de reversement)
- `users` — comptes (`admin`, `merchant` lié à une boutique, `courier`)
- `sessions` — sessions de connexion (seule l'empreinte du jeton est stockée)
- `deliveries` — commandes/livraisons, avec l'encaissement et les liens vers les reversements
- `settlements` — remises des livreurs et reversements aux commerçants
- `events` — journal (statuts, modifications, encaissements, comptes)

Les montants sont des entiers dans la devise (le FCFA n'a pas de décimales).

## Ajouter un pays, une devise ou un moyen de paiement

Tout est dans `src/lib/regions.ts` : ajoutez une entrée (devise, libellé, fuseau, indicatif,
longueur des numéros, moyens de paiement, quartiers suggérés), puis créez l'entreprise avec ce
`country_code`. Les moyens de paiement sont des codes stockés en base (`cash`, `wave`,
`orange_money`) : en ajouter un ne demande aucune migration.

## Ce qui n'est PAS automatisé (configuration externe requise)

Aucune connexion externe n'est simulée.

| Fonction | Aujourd'hui | Pour l'automatiser plus tard |
| --- | --- | --- |
| Paiements Wave | Saisie par le livreur, confirmation manuelle par l'admin | Compte **Wave Business** + clé API marchande et accord de Wave, puis un webhook de confirmation |
| Paiements Orange Money | Idem | Contrat marchand **Orange Money** (API Webpay / paiement marchand) : identifiants client, secret, numéro marchand |
| SMS | Bouton qui ouvre l'application Messages avec un texte prérempli | Un fournisseur SMS (ex. Orange SMS API) : clé API + nom d'expéditeur validé |
| WhatsApp | Bouton `wa.me` qui ouvre WhatsApp avec un texte prérempli | **WhatsApp Business Platform** : numéro vérifié, jeton d'accès, modèles de messages approuvés |
| Itinéraire | Lien public Google Maps (recherche d'adresse) | Rien à configurer |

Les reversements Wave / Orange Money aux commerçants se font en dehors de l'application,
puis sont enregistrés dans « Encaissements ».

## Mise en ligne

### Première installation (vraie entreprise, sans démo)

Sur une base vide, l'application affiche la page **/installation** : vous y créez votre entreprise
et votre compte administrateur, puis vous ajoutez vos livreurs et commerçants depuis l'application.
Cette page ne fonctionne qu'une fois (tant qu'aucun compte n'existe). En ligne, définissez la variable
**`SETUP_CODE`** (un code secret de votre choix) : il sera demandé sur cette page, pour que personne
d'autre ne puisse installer avant vous. **Ne lancez pas `npm run seed` en production.**

### Railway (recommandé, le plus simple)

Le dossier contient un `Dockerfile` prêt à l'emploi.

1. Créez un compte sur https://railway.app (connexion avec GitHub).
2. **New Project → Deploy from GitHub repo** → choisissez ce dépôt.
3. Dans le service : **Settings → Source → Root Directory** = `livraisons`
   (et la branche à déployer).
4. **Ajoutez un volume** au service, monté sur **`/data`** (sinon les données sont perdues à chaque déploiement).
5. **Variables** : `SETUP_CODE` = un code secret de votre choix, `HIDE_DEMO_HINT` = `1`.
6. **Settings → Networking → Generate Domain** : vous obtenez une adresse `https://….up.railway.app`.
7. Ouvrez cette adresse : la page d'installation s'affiche ; saisissez votre `SETUP_CODE`.

L'adresse fonctionne sur ordinateur et sur téléphone : envoyez-la à vos livreurs et commerçants avec
leurs identifiants. Vous pourrez ensuite brancher votre propre nom de domaine (ex. `livraison.barmanmobile.com`).

### Autres hébergeurs

N'importe quel hébergeur capable de lancer le `Dockerfile` **avec un disque persistant monté sur `/data`**
convient (Render avec « Persistent Disk », Fly.io avec volume, VPS). Les plateformes sans disque persistant
(ex. Vercel) ne conviennent pas en l'état. Sauvegardez régulièrement `/data` (base + photos).
Le passage à PostgreSQL reste possible plus tard : tout l'accès aux données passe par `src/lib/db.ts`
et les modules de `src/lib/`.

## Vérifications

```bash
npm run typecheck
npm run lint
npm test          # tests du cœur métier : isolation des données, statuts, encaissements, comptes
```
