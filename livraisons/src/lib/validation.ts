/** Petits outils de validation de formulaires (messages en français). */

export type FieldErrors = Record<string, string>;

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  /** Valeurs saisies, renvoyées pour pré-remplir le formulaire après une erreur. */
  values?: Record<string, string>;
  /** Données complémentaires (ex. mot de passe généré, à afficher une seule fois). */
  data?: Record<string, string | number>;
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optional(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$") && k !== "password") out[k] = v;
  return out;
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export const PASSWORD_MIN = 8;

export function invalid(errors: FieldErrors, fd: FormData, message = "Certains champs sont à corriger."): FormState {
  return { ok: false, message, errors, values: formValues(fd) };
}

/** Erreur métier affichable telle quelle à l'utilisateur. */
export class UserError extends Error {}
