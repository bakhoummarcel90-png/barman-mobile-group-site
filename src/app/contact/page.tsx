import type { Metadata } from "next";
import { Phone, Mail, MapPin, Instagram, Facebook, Music2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import WhatsAppButton from "@/components/WhatsAppButton";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez Barman Mobile Group à Dakar par téléphone, WhatsApp ou e-mail pour organiser votre événement.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">Contact</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">Parlons-en</h1>
          <p className="mt-6 max-w-xl text-ivoire/65">
            L'équipe Barman Mobile Group est joignable par téléphone, WhatsApp ou e-mail. Pour
            une réponse rapide, WhatsApp reste le moyen le plus efficace.
          </p>
        </Reveal>

        <Reveal className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-champagne/15 bg-nuit-soft p-6">
            <Phone className="h-6 w-6 text-champagne" />
            <p className="mt-3 text-sm text-ivoire/50">Téléphone</p>
            <a href={`tel:${siteConfig.contact.phonePrincipal.replace(/\s/g, "")}`} className="focus-ring mt-1 block text-ivoire hover:text-champagne">
              {siteConfig.contact.phonePrincipal}
            </a>
          </div>
          <div className="rounded-2xl border border-champagne/15 bg-nuit-soft p-6">
            <Mail className="h-6 w-6 text-champagne" />
            <p className="mt-3 text-sm text-ivoire/50">E-mail</p>
            <a href={`mailto:${siteConfig.contact.email}`} className="focus-ring mt-1 block break-all text-ivoire hover:text-champagne">
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="rounded-2xl border border-champagne/15 bg-nuit-soft p-6">
            <MapPin className="h-6 w-6 text-champagne" />
            <p className="mt-3 text-sm text-ivoire/50">Adresse</p>
            <p className="mt-1 text-ivoire">{siteConfig.contact.address}</p>
          </div>
          <div className="rounded-2xl border border-champagne/15 bg-nuit-soft p-6">
            <p className="text-sm text-ivoire/50">WhatsApp</p>
            <p className="mt-1 text-ivoire">{siteConfig.contact.whatsapp1}</p>
            <p className="text-ivoire/70">{siteConfig.contact.whatsapp2}</p>
            <div className="mt-4">
              <WhatsAppButton />
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-12 flex items-center gap-5">
          <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="focus-ring text-ivoire/60 hover:text-champagne">
            <Instagram className="h-6 w-6" />
          </a>
          <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="focus-ring text-ivoire/60 hover:text-champagne">
            <Facebook className="h-6 w-6" />
          </a>
          <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="focus-ring text-ivoire/60 hover:text-champagne">
            <Music2 className="h-6 w-6" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
