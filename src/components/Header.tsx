"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { siteConfig } from "@/config/site";
import { services } from "@/config/services";

const navLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/formules", label: "Nos formules" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/devis", label: "Demander un devis" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-nuit/95 py-3 shadow-soft backdrop-blur"
          : "bg-gradient-to-b from-nuit/80 to-transparent py-6"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
        <Link href="/" className="focus-ring rounded-md bg-white px-2 py-1 shadow-soft" aria-label="Barman Mobile Group — Accueil">
          <Image src="/images/logo.webp" alt="Barman Mobile Group" width={200} height={86} className="h-10 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <div
            className="group relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="focus-ring flex items-center gap-1 text-sm text-ivoire/90 hover:text-champagne">
              Nos services <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {servicesOpen && (
              <div className="absolute left-0 top-full w-72 rounded-lg border border-champagne/15 bg-nuit-soft p-2 shadow-soft">
                <Link
                  href="/services"
                  className="focus-ring block rounded-md px-3 py-2 text-sm text-champagne hover:bg-nuit-light"
                >
                  Vue d'ensemble des services
                </Link>
                <div className="my-1 h-px bg-champagne/10" />
                {services.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="focus-ring block rounded-md px-3 py-2 text-sm text-ivoire/85 hover:bg-nuit-light hover:text-champagne"
                  >
                    {s.shortName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring text-sm text-ivoire/90 hover:text-champagne"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/devis"
            className="focus-ring inline-flex items-center rounded-full bg-champagne px-5 py-2.5 text-sm font-medium text-nuit transition-colors hover:bg-champagne-light"
          >
            Demander un devis
          </Link>
        </div>

        <button
          className="focus-ring text-ivoire lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-champagne/10 bg-nuit px-5 py-4 lg:hidden">
          <p className="mb-2 text-xs uppercase tracking-wide text-ivoire/50">Nos services</p>
          <div className="mb-4 flex flex-col gap-1">
            <Link href="/services" onClick={() => setOpen(false)} className="focus-ring py-1.5 text-sm text-champagne">
              Vue d'ensemble
            </Link>
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                onClick={() => setOpen(false)}
                className="focus-ring py-1.5 text-sm text-ivoire/85"
              >
                {s.shortName}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-1 border-t border-champagne/10 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="focus-ring py-1.5 text-sm text-ivoire/90"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <a
            href={`tel:${siteConfig.contact.phonePrincipal.replace(/\s/g, "")}`}
            className="focus-ring mt-4 block text-center text-sm text-champagne"
          >
            {siteConfig.contact.phonePrincipal}
          </a>
        </div>
      )}
    </header>
  );
}
