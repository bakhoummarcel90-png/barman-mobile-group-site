# Barman Mobile Group — Site vitrine

Site officiel de **Barman Mobile Group (BMG)**, entreprise événementielle
sénégalaise — « La fête ne commence pas sans nous ».

Domaine officiel : **https://barmanmobile.com**

Construit avec **Next.js 16 (App Router) + TypeScript + Tailwind CSS**.

---

## 1. Installation

Prérequis : [Node.js](https://nodejs.org) version 20.9 ou supérieure.

```bash
npm install
```

## 2. Lancer le site en local

```bash
npm run dev
```

Le site est alors accessible sur http://localhost:3000

## 3. Construire la version de production

```bash
npm run build
npm run start
```

> Note : la génération (`build`) télécharge les polices Google Fonts
> (Fraunces et Manrope) au moment de la compilation. Une connexion
> internet est donc nécessaire pendant le build (c'est le cas par défaut
> chez Vercel).

---

## 4. Structure du projet

```
src/
  app/                     → Toutes les pages du site (une page = un dossier)
    page.tsx               → Accueil
    services/              → Vue d'ensemble + page dynamique par pôle
    realisations/          → Galerie
    formules/               → Formules commerciales
    devis/                  → Formulaire de devis
    a-propos/, notre-histoire/, contact/, faq/
    mentions-legales/, politique-confidentialite/
    sitemap.ts, robots.ts  → SEO technique généré automatiquement
  components/              → Composants réutilisables (Header, Footer, formulaire...)
  config/                  → ⭐ FICHIERS À MODIFIER pour personnaliser le site
    site.ts                → Coordonnées, réseaux sociaux, chiffres clés
    services.ts             → Les 6 pôles de services, méthode de travail
    pricing.ts               → Formules commerciales et catalogue de location
    faq.ts                   → Questions/réponses et types d'événements
  lib/
    whatsapp.ts            → Génération des liens et messages WhatsApp
```

Toute la logique métier (coordonnées, tarifs, services) est centralisée
dans le dossier **`src/config/`**. Vous n'avez presque jamais besoin de
toucher au code des pages pour changer un contenu.

---

## 5. Photos

Les photos officielles de Barman Mobile Group sont intégrées dans
`public/images/` au format WebP optimisé. La galerie se modifie dans
`src/app/realisations/page.tsx`. Les images principales de chaque pôle sont
définies dans `src/config/services.ts`.

Pour ajouter une photo, placez-la dans `public/images/`, puis renseignez son
chemin et un texte alternatif descriptif dans la page ou la configuration
concernée.

## 6. Logo

Le logo officiel est intégré dans `public/images/logo.webp` et utilisé dans
l'en-tête et le pied de page.

## 7. Modifier les coordonnées

Tout se passe dans **`src/config/site.ts`** :

```ts
contact: {
  phonePrincipal: "+221 77 171 46 62",
  whatsapp1: "+221 76 189 30 48",
  whatsapp2: "+221 77 256 24 48",
  email: "bakhoummarcel90@gmail.com",
  address: "Mamelles, Dakar, Sénégal",
  ...
},
social: {
  instagram: "...",
  facebook: "...",
  tiktok: "...",
},
```

Modifiez ces valeurs : elles se répercutent automatiquement sur tout le
site (en-tête, pied de page, page Contact, bouton WhatsApp, mentions
légales, données Schema.org pour le référencement).

## 8. Modifier les tarifs et les formules

Dans **`src/config/pricing.ts`** :

- `formules` : les 5 formules (Essential, Essential+, Prestige, Signature,
  VIP sur mesure). Le champ `priceFromFCFA` est à `null` par défaut (aucun
  prix définitif affiché, conformément à la politique commerciale actuelle) ;
  renseignez un nombre si vous souhaitez un jour afficher un tarif « à
  partir de ».
- `rentalCatalog` : le catalogue de location de matériel (verrerie,
  vaisselle, mobilier...). Renseignez `priceFCFA` pour chaque article afin
  d'afficher un tarif au lieu de « Sur devis ».

## 9. Modifier les services, la méthode de travail, la FAQ

- Les 6 pôles de services : `src/config/services.ts`
- Les questions fréquentes et types d'événements : `src/config/faq.ts`

Chaque service est décrit par un objet avec un titre, une accroche, une
liste de prestations incluses, etc. Ajouter/modifier un service ne
nécessite aucune autre modification : sa page est générée automatiquement
sur `/services/<slug>`.

---

## 10. Déployer sur Vercel

1. Créez un dépôt Git (GitHub, GitLab...) et poussez ce projet.
2. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous.
3. Cliquez sur **Add New → Project** et importez votre dépôt.
4. Vercel détecte automatiquement Next.js : laissez les réglages par
   défaut et cliquez sur **Deploy**.
5. Une fois déployé, ajoutez **barmanmobile.com** dans
   **Project Settings → Domains**. Le domaine officiel est déjà renseigné
   dans `src/config/site.ts` pour le SEO, le sitemap et les données structurées.

Aucune variable d'environnement n'est nécessaire pour le fonctionnement
actuel du site (le formulaire de devis fonctionne entièrement côté
navigateur, via un lien WhatsApp prérempli).

---

## 11. Prochaines évolutions prévues

- **Versions anglaise et allemande** : l'architecture (`src/app/`,
  `src/config/`) est prête à accueillir un système de contenu multilingue
  (ex. `next-intl`) une fois la version française validée.
- **Galerie** : enrichir progressivement les réalisations avec les nouvelles
  prestations photographiées.
- **Bandeau de cookies** : à ajouter uniquement si un outil nécessitant
  un consentement (statistiques, publicité) est intégré ultérieurement —
  aucun cookie non essentiel n'est utilisé actuellement.
