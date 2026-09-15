import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function WhatsAppButton({
  message = "Bonjour Barman Mobile Group, je souhaite avoir des renseignements sur vos prestations.",
  label,
  floating = false,
}: {
  message?: string;
  label?: string;
  floating?: boolean;
}) {
  const href = buildWhatsAppLink(message);

  if (floating) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter avec Barman Mobile Group sur WhatsApp"
        className="focus-ring fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-terre text-ivoire shadow-soft transition-transform hover:scale-105 md:bottom-8 md:right-8"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-champagne/40 bg-transparent px-6 py-3 text-sm font-medium text-ivoire transition-colors hover:border-champagne hover:bg-champagne/10"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label ?? "Parler à un conseiller"}
    </a>
  );
}
