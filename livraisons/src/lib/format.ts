import { CountryConfig, getCountry } from "./regions";

/* ---------- Montants ---------- */

export function formatMoney(amount: number | null | undefined, country: CountryConfig = getCountry(null)): string {
  if (amount === null || amount === undefined) return "—";
  const n = new Intl.NumberFormat(country.locale, {
    minimumFractionDigits: country.currencyDecimals,
    maximumFractionDigits: country.currencyDecimals,
  }).format(amount);
  // Espaces insécables fines → espaces insécables simples (rendu homogène sur mobile).
  return `${n.replace(/ /g, " ")} ${country.currencyLabel}`;
}

/** Montant en chiffres simples pour les exports CSV. */
export function plainAmount(amount: number | null | undefined): string {
  return amount === null || amount === undefined ? "" : String(amount);
}

/**
 * Lit un montant saisi (« 15 000 », « 15000 », « 15.000 »).
 * Renvoie null si la saisie n'est pas un entier positif.
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[\s  .]/g, "").replace(/fcfa|cfa|f$/i, "");
  if (cleaned === "") return null;
  if (!/^\d{1,12}$/.test(cleaned)) return null;
  return Number(cleaned);
}

/* ---------- Téléphones ---------- */

/**
 * Normalise un numéro au format international « +221771234567 ».
 * Accepte « 77 123 45 67 », « +221 77 123 45 67 », « 00221771234567 »…
 */
export function normalizePhone(raw: unknown, country: CountryConfig = getCountry(null)): string | null {
  if (typeof raw !== "string") return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === country.dialCode.length + country.nationalNumberLength && digits.startsWith(country.dialCode)) {
    digits = digits.slice(country.dialCode.length);
  }
  if (!/^\d+$/.test(digits) || digits.length !== country.nationalNumberLength) return null;
  return `+${country.dialCode}${digits}`;
}

/** « +221771234567 » → « 77 123 45 67 ». */
export function formatPhone(phone: string | null | undefined, country: CountryConfig = getCountry(null)): string {
  if (!phone) return "—";
  const prefix = `+${country.dialCode}`;
  if (!phone.startsWith(prefix)) return phone;
  const n = phone.slice(prefix.length);
  if (n.length === 9) return `${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
  return n;
}

/** Numéro pour les liens wa.me (chiffres uniquement, avec indicatif). */
export function waNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/* ---------- Dates et fuseau horaire ---------- */

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const m: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") m[p.type] = Number(p.value);
  const asUtc = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** « 2026-11-09T14:30 » (heure locale de l'entreprise) → ISO UTC. */
export function localInputToIso(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(local.trim());
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
  if (Number.isNaN(guess)) return null;
  const offset = tzOffsetMinutes(new Date(guess), timeZone);
  return new Date(guess - offset * 60000).toISOString();
}

/** ISO UTC → « 2026-11-09T14:30 » pour un champ datetime-local. */
export function isoToLocalInput(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const offset = tzOffsetMinutes(d, timeZone);
  return new Date(d.getTime() + offset * 60000).toISOString().slice(0, 16);
}

/** Date du jour (AAAA-MM-JJ) dans le fuseau de l'entreprise. */
export function todayLocal(timeZone: string, now: Date = new Date()): string {
  return isoToLocalInput(now.toISOString(), timeZone).slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(iso: string | null | undefined, country: CountryConfig = getCountry(null)): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(country.locale, {
    timeZone: country.timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined, country: CountryConfig = getCountry(null)): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(country.locale, {
    timeZone: country.timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined, country: CountryConfig = getCountry(null)): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(country.locale, {
    timeZone: country.timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "hier" : `il y a ${d} jours`;
}
