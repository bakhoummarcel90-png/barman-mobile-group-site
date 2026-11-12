import { getCurrentUser } from "@/lib/auth";
import { getDelivery } from "@/lib/deliveries";
import { readPhoto } from "@/lib/storage";

/** Photo de preuve : servie uniquement aux personnes qui ont accès à la livraison. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const d = getDelivery(user, Number((await params).id));
  const file = new URL(req.url).searchParams.get("type") === "signature" ? d?.signature : d?.proof_photo;
  if (!file) return new Response("Introuvable", { status: 404 });
  const photo = readPhoto(user.companyId, file);
  if (!photo) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: { "Content-Type": photo.type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
