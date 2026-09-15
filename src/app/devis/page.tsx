import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import { siteConfig } from "@/config/site";
import Reveal from "@/components/Reveal";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Demander un devis",
  description:
    "Décrivez votre événement et recevez une proposition personnalisée de Barman Mobile Group : bar mobile, catering, open grill, location et personnel.",
  alternates: { canonical: "/devis" },
};

export default function DevisPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Demande de devis</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
            Parlons de votre événement
          </h1>
          <p className="mt-6 text-ivoire/65">
            Remplissez ce formulaire pour recevoir une proposition adaptée. Vous pouvez aussi
            nous écrire directement sur WhatsApp au{" "}
            <a
              href={buildWhatsAppLink(
                "Bonjour Barman Mobile, je souhaite obtenir des informations pour mon événement.",
                siteConfig.contact.whatsapp1,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne hover:underline"
            >
              {siteConfig.contact.whatsapp1}
            </a>
            .
          </p>
        </Reveal>

        <div className="mt-12">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
