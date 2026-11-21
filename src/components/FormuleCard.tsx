import Link from "next/link";
import { Check } from "lucide-react";
import { visuelBars, type Formule } from "@/config/pricing";

export default function FormuleCard({ formule }: { formule: Formule }) {
  const visuel = visuelBars(formule);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border ${
        formule.highlight
          ? "border-champagne bg-nuit-light shadow-soft"
          : "border-champagne/15 bg-nuit-soft"
      }`}
    >
      {/* Photo du bar standard de la formule */}
      <figure className="relative">
        <img
          src={visuel.src}
          alt={`${visuel.legende}, inclus dans la formule ${formule.name}`}
          width={1200}
          height={900}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
        {formule.highlight && (
          <span className="absolute left-4 top-4 rounded-full bg-champagne px-3 py-1 text-xs font-medium text-nuit">
            La plus demandée
          </span>
        )}
        <figcaption className="border-y border-champagne/20 bg-nuit/60 px-7 py-3">
          <p className="text-xs uppercase tracking-[0.15em] text-champagne">{visuel.titre}</p>
          <p className="mt-0.5 text-sm font-medium text-ivoire">{visuel.legende}</p>
        </figcaption>
      </figure>

      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-2xl text-ivoire">{formule.name}</h3>
        <p className="mt-2 text-sm text-ivoire/60">{formule.pitch}</p>

        <div className="mt-5 rounded-xl border border-champagne/25 bg-nuit/40 p-4 text-xs text-ivoire/70">
          <p>
            <span className="text-ivoire">Plus d'invités ?</span> Nous ajoutons des bars pour garder
            l'espace nécessaire à un service fluide.
          </p>
          <p className="mt-2">
            <span className="text-ivoire">Couleur :</span> noir, blanc ou à la couleur de votre événement.
          </p>
          <Link
            href="/formules#nos-bars"
            className="mt-3 inline-block font-medium text-champagne hover:underline"
          >
            Combien de bars pour mon événement →
          </Link>
        </div>

        <ul className="mt-5 flex-1 space-y-2.5">
          {formule.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-ivoire/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-ivoire/65">Idéal pour : {formule.idealFor}</p>
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
    </div>
  );
}
