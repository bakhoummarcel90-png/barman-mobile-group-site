import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "./constants";
import { get, run } from "./db";
import type { Actor } from "./types";

const COOKIE = "sl_session";
const SESSION_DAYS = 30;

function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const now = new Date().toISOString();
  run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", digest(token), userId, expires.toISOString());
  run("UPDATE users SET last_login_at = ? WHERE id = ?", now, userId);
  run("DELETE FROM sessions WHERE expires_at < ?", now);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE id = ?", digest(token));
  jar.delete(COOKIE);
}

interface ActorRow {
  id: number;
  company_id: number;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  merchant_id: number | null;
  company_name: string;
  country_code: string;
}

/** Utilisateur de la session courante, ou null. Les comptes désactivés n'ont plus accès. */
export const getCurrentUser = cache(async (): Promise<Actor | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = get<ActorRow>(
    `SELECT u.id, u.company_id, u.role, u.name, u.email, u.phone, u.merchant_id,
            c.name AS company_name, c.country_code
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN companies c ON c.id = u.company_id
       LEFT JOIN merchants m ON m.id = u.merchant_id
      WHERE s.id = ? AND s.expires_at > ? AND u.active = 1
        AND (u.role <> 'merchant' OR m.active = 1)`,
    digest(token),
    new Date().toISOString(),
  );
  if (!row) return null;
  return {
    id: row.id,
    companyId: row.company_id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    merchantId: row.merchant_id,
    companyName: row.company_name,
    countryCode: row.country_code,
  };
});

/** Exige une session (et éventuellement un rôle) ; sinon redirige. */
export async function requireUser(roles?: Role[]): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (roles && !roles.includes(user.role)) redirect("/");
  return user;
}

/* Limitation des tentatives de connexion (en mémoire, par identifiant). */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60_000;

export function loginLockedFor(identifier: string): number {
  const a = attempts.get(identifier);
  if (!a || a.count < MAX_ATTEMPTS) return 0;
  const left = a.until - Date.now();
  if (left <= 0) {
    attempts.delete(identifier);
    return 0;
  }
  return Math.ceil(left / 60000);
}

export function recordLoginFailure(identifier: string): void {
  const a = attempts.get(identifier) ?? { count: 0, until: 0 };
  a.count += 1;
  a.until = Date.now() + LOCK_MS;
  attempts.set(identifier, a);
}

export function clearLoginFailures(identifier: string): void {
  attempts.delete(identifier);
}
