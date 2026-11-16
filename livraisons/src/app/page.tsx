import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  // Visiteur : la page publique des voyages GP (lien partagé sur les réseaux).
  if (!user) redirect("/voyages");
  redirect(user.role === "courier" ? "/livraisons" : user.role === "gp" ? "/gp" : "/tableau-de-bord");
}
