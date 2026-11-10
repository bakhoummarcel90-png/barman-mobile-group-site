import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { get, run } from "@/lib/db";

/** Ouvre une notification : la marque comme lue puis redirige vers sa page (chemin interne uniquement). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  if (!user) return NextResponse.redirect(new URL("/connexion", url));
  const id = Number(url.searchParams.get("id"));
  const n = Number.isInteger(id) ? get<{ url: string | null }>("SELECT url FROM notifications WHERE id = ? AND user_id = ?", id, user.id) : undefined;
  if (!n) return NextResponse.redirect(new URL("/notifications", url));
  run("UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ?", new Date().toISOString(), id);
  const target = n.url && n.url.startsWith("/") && !n.url.startsWith("//") ? n.url : "/notifications";
  return NextResponse.redirect(new URL(target, url));
}
