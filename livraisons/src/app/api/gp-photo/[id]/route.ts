import { getCurrentUser } from "@/lib/auth";
import { getBooking } from "@/lib/gp";
import { readPhoto } from "@/lib/storage";

/** Photo du contenu d'un colis GP : visible par l'expéditeur, le GP du voyage et l'administrateur. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const b = getBooking(user, Number((await params).id));
  if (!b?.check_photo) return new Response("Introuvable", { status: 404 });
  const photo = readPhoto(user.companyId, b.check_photo);
  if (!photo) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
