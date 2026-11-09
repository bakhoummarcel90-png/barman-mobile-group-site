import { MapPinned, MessageCircle, MessageSquare, Phone } from "lucide-react";
import { mapsLink, smsLink, telLink, whatsappLink } from "@/lib/messages";
import type { DeliveryView } from "@/lib/types";
import { cx } from "./ui";

/**
 * Raccourcis vers les applications du téléphone. Rien n'est envoyé
 * automatiquement : l'utilisateur vérifie le texte puis appuie sur Envoyer.
 */
export function ContactButtons({
  phone,
  message,
  delivery,
  size = "normal",
  showMap = false,
  city,
}: {
  phone: string;
  message: string;
  delivery?: Pick<DeliveryView, "address" | "neighborhood">;
  size?: "normal" | "large";
  showMap?: boolean;
  /** Ville de l'entreprise, ajoutée à l'adresse pour l'itinéraire. */
  city?: string;
}) {
  const cls = cx("btn-secondary", size === "large" ? "btn-lg flex-1" : "btn-sm");
  return (
    <div className="flex flex-wrap gap-2">
      <a href={telLink(phone)} className={cls}>
        <Phone className="h-4 w-4" aria-hidden /> Appeler
      </a>
      <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" className={cls}>
        <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden /> WhatsApp
      </a>
      <a href={smsLink(phone, message)} className={cls}>
        <MessageSquare className="h-4 w-4" aria-hidden /> SMS
      </a>
      {showMap && delivery ? (
        <a href={mapsLink(delivery, city)} target="_blank" rel="noopener noreferrer" className={cls}>
          <MapPinned className="h-4 w-4 text-sky-600" aria-hidden /> Itinéraire
        </a>
      ) : null}
    </div>
  );
}
