import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Music2, Phone, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { services } from "@/config/services";

export default function Footer() {
  return (
    <footer className="border-t border-champagne/10 bg-nuit-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div>
          <div className="inline-flex rounded-md bg-white px-2 py-1">
            <Image src="/images/logo.webp" alt="Barman Mobile Group" width={220} height={95} className="h-12 w-auto" />
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivoire/60">
            {siteConfig.slogan}
          </p>
          <div className="mt-5 flex gap-4">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Barman Mobile Group"
              className="focus-ring text-ivoire/60 hover:text-champagne"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Barman Mobile Group"
              className="focus-ring text-ivoire/60 hover:text-champagne"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={siteConfig.social.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Barman Mobile Group"
              className="focus-ring text-ivoire/60 hover:text-champagne"
            >
              <Music2 className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-champagne">Nos services</p>
          <ul className="mt-4 space-y-2.5">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="focus-ring text-sm text-ivoire/65 hover:text-ivoire"
                >
                  {s.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-champagne">Barman Mobile Group</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ivoire/65">
            <li><Link href="/a-propos" className="focus-ring hover:text-ivoire">À propos</Link></li>
            <li><Link href="/notre-histoire" className="focus-ring hover:text-ivoire">Notre histoire</Link></li>
            <li><Link href="/formules" className="focus-ring hover:text-ivoire">Nos formules</Link></li>
            <li><Link href="/realisations" className="focus-ring hover:text-ivoire">Réalisations</Link></li>
            <li><Link href="/faq" className="focus-ring hover:text-ivoire">FAQ</Link></li>
            <li><Link href="/mentions-legales" className="focus-ring hover:text-ivoire">Mentions légales</Link></li>
            <li><Link href="/politique-confidentialite" className="focus-ring hover:text-ivoire">Confidentialité</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-champagne">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-ivoire/65">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-champagne/70" />
              {siteConfig.contact.address}
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-champagne/70" />
              <a href={`tel:${siteConfig.contact.phonePrincipal.replace(/\s/g, "")}`} className="focus-ring hover:text-ivoire">
                {siteConfig.contact.phonePrincipal}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-champagne/70" />
              <a href={`mailto:${siteConfig.contact.email}`} className="focus-ring hover:text-ivoire">
                {siteConfig.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-champagne/10 px-5 py-6 text-center text-xs text-ivoire/40">
        © {new Date().getFullYear()} Barman Mobile Group — Tous droits réservés.
      </div>
    </footer>
  );
}
