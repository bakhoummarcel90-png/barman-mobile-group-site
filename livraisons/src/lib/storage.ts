import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { dataDir } from "./db";
import { UserError } from "./validation";

/**
 * Photos de preuve de livraison, stockées hors du dossier public :
 * DATA_DIR/uploads/<entreprise>/<fichier>. Elles ne sont servies que par
 * /api/photos/[id], après vérification des droits d'accès à la livraison.
 */

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function detectType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/** Enregistre la photo si elle est valide ; renvoie son nom relatif, ou null si aucun fichier. */
export async function savePhoto(companyId: number, file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_PHOTO_BYTES) throw new UserError("Photo trop lourde (5 Mo maximum).");
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectType(buf);
  if (!ext) throw new UserError("Format de photo non reconnu : utilisez JPEG, PNG ou WebP.");
  const rel = path.join(String(companyId), `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`);
  const abs = path.join(dataDir(), "uploads", rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
  return rel;
}

export function readPhoto(companyId: number, rel: string): { data: Buffer; type: string } | null {
  // Le chemin enregistré doit appartenir au dossier de l'entreprise (pas de « ../ »).
  if (!/^\d+[\\/][\w-]+\.(jpg|png|webp)$/.test(rel) || !rel.startsWith(`${companyId}`)) return null;
  const abs = path.join(dataDir(), "uploads", rel);
  if (!existsSync(abs)) return null;
  const ext = rel.split(".").pop()!;
  return { data: readFileSync(abs), type: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
}
