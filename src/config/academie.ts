// ============================================================================
// CONFIG — RUBRIQUES "À VENIR" DE LA PAGE /academie
// Pour ajouter un nouveau produit à venir, ajoutez un objet au tableau
// `upcomingOfferings`. Pour ajouter un produit disponible à l'achat,
// créez un fichier config dédié (voir manuel.ts / ebook.ts en exemple)
// et une nouvelle rubrique dans src/app/academie/page.tsx.
// ============================================================================

export const upcomingOfferings = [
  {
    id: "formation",
    navLabel: "Formation",
    title: "Formation en ligne",
    description:
      "Une formation en ligne complète pour approfondir les techniques du manuel, avec suivi et mise en pratique guidée.",
    status: "Bientôt disponible",
  },
  {
    id: "kits",
    navLabel: "Kits",
    title: "Kits professionnels",
    description:
      "Des kits de matériel professionnel pour barman, pensés pour démarrer ou compléter votre équipement.",
    status: "À venir",
  },
] as const;
