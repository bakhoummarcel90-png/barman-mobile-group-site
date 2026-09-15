"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-champagne/10 rounded-2xl border border-champagne/15 bg-nuit-soft">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="focus-ring flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-display text-base text-ivoire">{item.question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-champagne transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && <p className="px-6 pb-5 text-sm leading-relaxed text-ivoire/65">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
