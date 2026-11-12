/*
 * Prix automatique d'une course (inspiré des applications de livraison à la
 * demande) : tarif de base du véhicule + prix au kilomètre + options, avec un
 * minimum, arrondi à la centaine supérieure.
 *
 * La distance est ESTIMÉE à vol d'oiseau entre les centres approximatifs des
 * quartiers de départ (boutique) et d'arrivée (client), multipliée par 1,35
 * pour tenir compte des routes. Aucun service de cartographie payant n'est
 * utilisé. Si un quartier est inconnu, pas de prix automatique : les frais sont
 * saisis à la main. La grille est modifiable dans Paramètres.
 */

export const VEHICLE_TYPES = ["Moto", "Tricycle", "Voiture", "Camionnette", "Camion"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_HINTS: Record<VehicleType, string> = {
  Moto: "Petits colis, documents (jusqu'à ~20 kg)",
  Tricycle: "Cartons, courses (jusqu'à ~300 kg)",
  Voiture: "Colis moyens, objets fragiles",
  Camionnette: "Meubles, électroménager",
  Camion: "Déménagement, grosses charges",
};

export const OPTIONS = {
  aide: "Aide au chargement / déchargement",
  fragile: "Colis fragile (manipulation soignée)",
} as const;
export type OptionCode = keyof typeof OPTIONS;

export interface VehicleTariff {
  base: number;
  perKm: number;
  min: number;
}

export interface Tariffs {
  vehicles: Record<VehicleType, VehicleTariff>;
  options: Record<OptionCode, number>;
}

/** Grille par défaut (FCFA, Dakar) — à ajuster par l'entreprise. */
export const DEFAULT_TARIFFS: Tariffs = {
  vehicles: {
    Moto: { base: 1000, perKm: 200, min: 1500 },
    Tricycle: { base: 2500, perKm: 300, min: 3000 },
    Voiture: { base: 3000, perKm: 350, min: 3500 },
    Camionnette: { base: 8000, perKm: 600, min: 10000 },
    Camion: { base: 20000, perKm: 1000, min: 25000 },
  },
  options: { aide: 2000, fragile: 500 },
};

/** Lit la grille enregistrée (JSON) en complétant avec les valeurs par défaut. */
export function parseTariffs(json: string | null | undefined): Tariffs {
  const t: Tariffs = JSON.parse(JSON.stringify(DEFAULT_TARIFFS));
  if (!json) return t;
  try {
    const saved = JSON.parse(json) as Partial<Tariffs>;
    for (const v of VEHICLE_TYPES) {
      const s = saved.vehicles?.[v];
      if (s) for (const k of ["base", "perKm", "min"] as const) if (Number.isFinite(s[k]) && s[k] >= 0) t.vehicles[v][k] = Math.round(s[k]);
    }
    for (const o of Object.keys(OPTIONS) as OptionCode[]) {
      const val = saved.options?.[o];
      if (Number.isFinite(val) && (val as number) >= 0) t.options[o] = Math.round(val as number);
    }
  } catch {
    /* grille illisible : valeurs par défaut */
  }
  return t;
}

/** Centres approximatifs des quartiers (latitude, longitude), pour estimer les distances. */
export const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  almadies: [14.745, -17.52], ngor: [14.75, -17.514], ouakam: [14.722, -17.49], mermoz: [14.707, -17.475],
  "sacre-coeur": [14.719, -17.466], "sacre-coeur 3": [14.725, -17.464], "point e": [14.695, -17.46],
  fann: [14.69, -17.466], plateau: [14.668, -17.432], medina: [14.683, -17.448], fass: [14.686, -17.452],
  colobane: [14.69, -17.441], "grand dakar": [14.705, -17.445], hlm: [14.71, -17.44], "liberte 6": [14.727, -17.459],
  "sicap baobab": [14.711, -17.455], dieuppeul: [14.716, -17.451], "grand yoff": [14.736, -17.449],
  "parcelles assainies": [14.765, -17.44], parcelles: [14.765, -17.44], yoff: [14.755, -17.47],
  "ouest foire": [14.746, -17.47], "cite keur gorgui": [14.712, -17.466], "keur gorgui": [14.712, -17.466],
  "hann maristes": [14.725, -17.425], hann: [14.72, -17.43], pikine: [14.755, -17.392], guediawaye: [14.776, -17.403],
  thiaroye: [14.752, -17.37], "keur massar": [14.78, -17.31], mbao: [14.74, -17.322], rufisque: [14.716, -17.272],
  diamniadio: [14.72, -17.183], "liberte": [14.722, -17.455], "patte d'oie": [14.745, -17.444],
};

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\u0153/g, "oe") // œ
    .replace(/\u00e6/g, "ae") // æ
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_COORDS: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(NEIGHBORHOOD_COORDS).map(([k, v]) => [normalizeName(k), v]),
);

export function coordsOf(neighborhood: string | null | undefined): [number, number] | null {
  if (!neighborhood) return null;
  return NORMALIZED_COORDS[normalizeName(neighborhood)] ?? null;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance routière estimée (km, 1 décimale), ou null si un quartier est inconnu. */
export function estimateKm(from: string | null | undefined, to: string | null | undefined): number | null {
  const a = coordsOf(from);
  const b = coordsOf(to);
  if (!a || !b) return null;
  return Math.max(1, Math.round(haversineKm(a, b) * 1.35 * 10) / 10);
}

export interface Quote {
  km: number;
  price: number;
}

export function quote(tariffs: Tariffs, vehicle: VehicleType, from: string | null | undefined, to: string | null | undefined, options: OptionCode[]): Quote | null {
  const km = estimateKm(from, to);
  if (km === null) return null;
  const v = tariffs.vehicles[vehicle];
  const raw = Math.max(v.min, v.base + v.perKm * km) + options.reduce((s, o) => s + (tariffs.options[o] ?? 0), 0);
  return { km, price: Math.ceil(raw / 100) * 100 };
}

export function isVehicleType(v: unknown): v is VehicleType {
  return typeof v === "string" && (VEHICLE_TYPES as readonly string[]).includes(v);
}

/** Un livreur peut prendre une course s'il a ce véhicule (ou un plus gros), ou s'il n'a pas indiqué de véhicule. */
export function courierCanTake(courierVehicle: string | null, wanted: string | null): boolean {
  if (!wanted || !courierVehicle) return true;
  const rank = (v: string) => (VEHICLE_TYPES as readonly string[]).indexOf(v);
  const c = rank(courierVehicle);
  const w = rank(wanted);
  if (w < 0) return true;
  // Vélo / à pied : seulement les courses « Moto » (petits colis).
  if (c < 0) return wanted === "Moto";
  return c >= w;
}

/** « 12500 » → « 12 500 », « 3.2 » → « 3,2 » : identique côté serveur et navigateur (pas d'écart d'affichage). */
export function formatNumber(n: number): string {
  const [int, dec] = String(n).split(".");
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + (dec ? `,${dec}` : "");
}
