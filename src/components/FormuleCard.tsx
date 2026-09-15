import Link from "next/link";
import { Check } from "lucide-react";
import type { Formule } from "@/config/pricing";

export default function FormuleCard({ formule }: { formule: Formule }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-7 ${
        formule.highlight
          ? "border-champagne bg-nuit-light shadow-soft"
          : "border-champagne/15 bg-nuit-soft"
      }`}
    >
      {formule.highlight && (
        <span className="mb-4 inline-block w-fit rounded-full bg-champagne px-3 py-1 text-xs font-medium text-nuit">
          La plus demandée
        </span>
      )}
      <h3 className="font-display text-2xl text-ivoire">{formule.name}</h3>
      <p className="mt-2 text-sm text-ivoire/60">{formule.pitch}</p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {formule.includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ivoire/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-ivoire/45">Idéal pour : {formule.idealFor}</p>
      <p className="mt-1 text-sm text-champagne">
        {formule.priceFromFCFA ? `À partir de ${formule.priceFromFCFA.toLocaleString("fr-FR")} FCFA` : "Tarif sur devis"}
      </p>
      <Link
        href="/devis"
        className="focus-ring mt-5 inline-flex items-center justify-center rounded-full border border-champagne/40 px-5 py-2.5 text-sm font-medium text-ivoire transition-colors hover:border-champagne hover:bg-champagne/10"
      >
        Demander un devis
      </Link>
    </div>
  );
}
