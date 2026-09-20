import Image from "next/image";
import { decorationItems } from "@/config/decoration";

export default function DecorationCatalog() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {decorationItems.map((item) => (
        <div
          key={item.slug}
          className="flex flex-col overflow-hidden rounded-2xl border border-champagne/15 bg-nuit-soft"
        >
          <div className="relative aspect-[4/3] w-full bg-nuit-light">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-5 text-center">
            <h3 className="font-display text-lg text-ivoire">{item.name}</h3>
            {item.variant && <p className="text-sm text-ivoire/60">{item.variant}</p>}
            <p className="text-xs text-ivoire/40">{item.availability}</p>
            <div className="mt-3">
              <span className="inline-block rounded-full border border-champagne px-4 py-2 text-sm text-champagne">
                {item.priceFCFA.toLocaleString("fr-FR")} FCFA / {item.unit}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
