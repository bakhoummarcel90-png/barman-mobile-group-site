import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { siteConfig } from "@/config/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EventPlanner",
    name: siteConfig.name,
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
    url: siteConfig.url,
    areaServed: "Sénégal",
    sameAs: [siteConfig.social.instagram, siteConfig.social.facebook, siteConfig.social.tiktok],
  };

  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
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
