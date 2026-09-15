import type { Metadata } from "next";
import { faqItems } from "@/config/faq";
import FaqAccordion from "@/components/FaqAccordion";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Foire aux questions",
  description:
    "Toutes les réponses à vos questions sur les prestations, tarifs et zones d'intervention de Barman Mobile Group.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <section className="px-5 pb-24 pt-36">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-sm uppercase tracking-[0.2em] text-champagne/80">FAQ</p>
          <h1 className="mt-4 font-display text-4xl text-ivoire md:text-5xl">
            Questions fréquentes
          </h1>
        </Reveal>
        <Reveal className="mt-10" delayMs={80}>
          <FaqAccordion items={faqItems} />
        </Reveal>
      </div>
    </section>
  );
}
