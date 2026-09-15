"use client";

import { useState } from "react";
import { X } from "lucide-react";
import PlaceholderImage from "./PlaceholderImage";

export default function Lightbox({ items }: { items: { description: string; aspect: string; src?: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {items.map((item, i) => (
          <button
            key={item.description}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="focus-ring block w-full text-left"
            aria-label={`Agrandir : ${item.description}`}
          >
            <PlaceholderImage description={item.description} src={item.src} aspect={item.aspect} />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-nuit/90 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="focus-ring absolute right-6 top-6 text-ivoire/70 hover:text-ivoire"
            onClick={() => setOpenIndex(null)}
          >
            <X className="h-7 w-7" />
          </button>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <PlaceholderImage
              description={items[openIndex].description}
              src={items[openIndex].src}
              aspect="aspect-[4/3]"
            />
          </div>
        </div>
      )}
    </>
  );
}
