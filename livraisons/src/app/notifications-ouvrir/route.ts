import { getCurrentUser } from "@/lib/auth";
import { get, run } from "@/lib/db";

/**
 * Redirection RELATIVE (« Location: /livreurs ») : derrière un hébergeur
 * (Railway…), l'adresse vue par le serveur est interne (localhost:8080) ;
 * le navigateur complète lui-même avec l'adresse publique.
 */
function go(path: string): Response {
  return new Response(null, { status: 303, headers: { Location: path, "Cache-Control": "no-store" } });
}

/** Ouvre une notification : la marque comme lue puis redirige vers sa page (chemin interne uniquement). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return go("/connexion");
  const id = Number(new URL(req.url).searchParams.get("id"));
  const n = Number.isInteger(id) ? get<{ url: string | null }>("SELECT url FROM notifications WHERE id = ? AND user_id = ?", id, user.id) : undefined;
  if (!n) return go("/notifications");
  run("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ?", new Date().toISOString(), id);
  const target = n.url && n.url.startsWith("/") && !n.url.startsWith("//") ? n.url : "/notifications";
  return go(target);
}
