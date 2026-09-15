import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "barman mobile Dakar",
    "bar mobile Sénégal",
    "open bar mariage Dakar",
    "cocktails mariage Sénégal",
    "service barman mariage Dakar",
    "location verrerie Dakar",
    "location matériel événementiel Dakar",
    "personnel événementiel Sénégal",
    "catering Dakar",
    "open grill Sénégal",
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "fr_SN",
    type: "website",
    images: [
      {
        url: "/images/hero-barman-mobile.webp",
        width: 2000,
        height: 1324,
        alt: "Barman Mobile Group en prestation à Dakar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: ["/images/hero-barman-mobile.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventPlanner",
    name: siteConfig.name,
    alternateName: siteConfig.commercialName,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    slogan: siteConfig.slogan,
    foundingDate: String(siteConfig.foundingYear),
    founder: {
      "@type": "Person",
      name: siteConfig.founder,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.contact.city,
      addressCountry: "SN",
      streetAddress: siteConfig.contact.address,
    },
    telephone: siteConfig.contact.phonePrincipal,
    email: siteConfig.contact.email,
    taxID: siteConfig.ninea,
    identifier: siteConfig.rccm,
    url: siteConfig.url,
    image: `${siteConfig.url}/images/logo.webp`,
    areaServed: "Sénégal",
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook, siteConfig.social.tiktok],
  };

  return (
    <html lang="fr">
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppButton floating />
      </body>
    </html>
  );
}
