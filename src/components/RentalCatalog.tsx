"use client";

import { useState } from "react";
import { rentalCatalog, rentalCategories } from "@/config/pricing";

export default function RentalCatalog() {
  const [active, setActive] = useState<string>("Tous");

  const filtered =
    active === "Tous" ? rentalCatalog : rentalCatalog.filter((item) => item.category === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["Tous", ...rentalCategories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`focus-ring rounded-full border px-4 py-2 text-sm transition-colors ${
              active === cat
                ? "border-champagne bg-champagne text-nuit"
                : "border-champagne/25 text-ivoire/70 hover:border-champagne/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-xl border border-champagne/15 bg-nuit-soft px-5 py-4"
          >
            <div>
              <p className="text-sm text-ivoire">{item.name}</p>
              <p className="text-xs text-ivoire/40">{item.category} · par {item.unit}</p>
            </div>
            <span className="text-sm text-champagne">
              {item.priceFCFA ? `${item.priceFCFA.toLocaleString("fr-FR")} FCFA` : "Sur devis"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
