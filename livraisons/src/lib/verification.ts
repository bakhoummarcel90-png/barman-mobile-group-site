import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { get, run, transaction } from "./db";
import { sendMail, verificationMail } from "./mail";
import { UserError } from "./validation";

/*
 * Code de vérification à 6 chiffres envoyé par e-mail à l'inscription.
 * La page /inscription/verifier/<jeton> demande le code ; le jeton (long,
 * aléatoire) n'identifie que l'inscription en cours et n'est stocké
 * qu'en empreinte. Code valable 15 min, 5 essais, renvoi toutes les 60 s
 * (5 envois au plus).
 */

const CODE_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS = 5;
const RESEND_DELAY_MS = 60_000;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const codeHash = (token: string, code: string) => sha(`${token}:${code}`);

interface VerificationRow {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: string;
  attempts: number;
  sends: number;
  last_sent_at: string;
}

interface UserInfo {
  id: number;
  name: string;
  email: string | null;
  role: string;
  company_name: string;
}

function userInfo(userId: number): UserInfo {
  const u = get<UserInfo>(
    "SELECT u.id, u.name, u.email, u.role, c.name AS company_name FROM users u JOIN companies c ON c.id = u.company_id WHERE u.id = ?",
    userId,
  );
  if (!u?.email) throw new UserError("Inscription introuvable.");
  return u;
}

/** Crée (ou remplace) la vérification d'un compte et envoie le code. Renvoie le jeton de la page de saisie. */
export async function startVerification(userId: number): Promise<string> {
  const u = userInfo(userId);
  const token = randomBytes(24).toString("base64url");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  run("DELETE FROM email_verifications WHERE user_id = ?", userId);
  run(
    "INSERT INTO email_verifications (user_id, token_hash, code_hash, expires_at, last_sent_at) VALUES (?, ?, ?, ?, ?)",
    userId,
    sha(token),
    codeHash(token, code),
    new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    now.toISOString(),
  );
  await sendMail(verificationMail(u.email!, u.name, code, u.company_name));
  return token;
}

function byToken(token: string): VerificationRow | undefined {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return undefined;
  return get<VerificationRow>("SELECT * FROM email_verifications WHERE token_hash = ?", sha(token));
}

/** Adresse masquée pour l'affichage (« aw***@gmail.com »). */
export function verificationTarget(token: string): { email: string } | null {
  const v = byToken(token);
  if (!v) return null;
  const email = userInfo(v.user_id).email!;
  const [local, domain] = email.split("@");
  return { email: `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}` };
}

/** Vérifie le code ; renvoie l'identifiant du compte confirmé. */
export function checkCode(token: string, rawCode: string): number {
  const code = rawCode.replace(/\s/g, "");
  const v = byToken(token);
  if (!v) throw new UserError("Ce lien de vérification n'est plus valable. Recommencez l'inscription.");
  if (v.attempts >= MAX_ATTEMPTS) throw new UserError("Trop d'essais. Demandez un nouveau code.");
  if (new Date(v.expires_at) < new Date()) throw new UserError("Ce code a expiré. Demandez un nouveau code.");
  const ok = /^\d{6}$/.test(code) && timingSafeEqual(Buffer.from(codeHash(token, code)), Buffer.from(v.code_hash));
  if (!ok) {
    // Hors transaction : l'essai raté doit rester compté même si on lève une erreur.
    run("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?", v.id);
    const left = MAX_ATTEMPTS - v.attempts - 1;
    throw new UserError(left > 0 ? `Code incorrect. Il vous reste ${left} essai(s).` : "Code incorrect. Demandez un nouveau code.");
  }
  return transaction(() => {
    // Consommation atomique : un même code ne peut servir qu'une fois.
    if (run("DELETE FROM email_verifications WHERE id = ? AND attempts < ?", v.id, MAX_ATTEMPTS).changes !== 1)
      throw new UserError("Ce lien de vérification n'est plus valable.");
    run("UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", new Date().toISOString(), v.user_id);
    return v.user_id;
  });
}

/** Renvoie un nouveau code (le jeton de la page reste le même). */
export async function resendCode(token: string): Promise<void> {
  const v = byToken(token);
  if (!v) throw new UserError("Ce lien de vérification n'est plus valable. Recommencez l'inscription.");
  if (v.sends >= MAX_SENDS) throw new UserError("Nombre maximal d'envois atteint. Recommencez l'inscription plus tard.");
  const wait = new Date(v.last_sent_at).getTime() + RESEND_DELAY_MS - Date.now();
  if (wait > 0) throw new UserError(`Patientez ${Math.ceil(wait / 1000)} secondes avant de demander un nouveau code.`);
  const u = userInfo(v.user_id);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  run(
    "UPDATE email_verifications SET code_hash = ?, expires_at = ?, attempts = 0, sends = sends + 1, last_sent_at = ? WHERE id = ?",
    codeHash(token, code),
    new Date(now.getTime() + CODE_TTL_MS).toISOString(),
    now.toISOString(),
    v.id,
  );
  await sendMail(verificationMail(u.email!, u.name, code, u.company_name));
}
