"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { decorationItems, type DecorationItem } from "@/config/decoration";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const formatFCFA = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-ivoire">{label}</p>
        {hint && <p className="text-xs text-ivoire/40">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Diminuer : ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-champagne/40 text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-lg text-ivoire" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Augmenter : ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-champagne/40 text-champagne transition-colors hover:bg-champagne/10 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ReservationModal({ item, onClose }: { item: DecorationItem; onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [days, setDays] = useState(1);
  const total = item.priceFCFA * quantity * days;

  // Fermer avec la touche Échap et bloquer le défilement de la page derrière
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const message = [
    "Bonjour Barman Mobile Group, je souhaite réserver du matériel de décoration :",
    "",
    `• Article : ${item.name}${item.variant ? ` (${item.variant})` : ""}`,
    `• Quantité : ${quantity}`,
    `• Durée : ${days} jour${days > 1 ? "s" : ""}`,
    `• Prix unitaire : ${formatFCFA(item.priceFCFA)} / ${item.unit}`,
    `• Total estimé : ${formatFCFA(total)}`,
    "",
    "Date de l'événement : ",
    "Lieu : ",
  ].join("\n");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-nuit/85 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Réserver : ${item.name}`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-champagne/20 bg-nuit-soft shadow-soft sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="focus-ring absolute right-3 top-3 z-10 rounded-full bg-nuit/70 p-2 text-ivoire/80 hover:text-ivoire"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-[4/3] w-full bg-nuit-light">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
            style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
          />
        </div>

        <div className="p-6">
          <h3 className="font-display text-xl text-ivoire">{item.name}</h3>
          {item.variant && <p className="text-sm text-ivoire/60">{item.variant}</p>}
          <p className="mt-1 text-sm text-champagne">
            {formatFCFA(item.priceFCFA)} / {item.unit}
          </p>

          <div className="mt-6 space-y-5">
            <Stepper
              label="Quantité"
              hint={item.availability}
              value={quantity}
              min={1}
              max={item.maxQuantity}
              onChange={setQuantity}
            />
            <Stepper label="Nombre de jours" value={days} min={1} max={30} onChange={setDays} />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-champagne/25 bg-nuit px-5 py-4">
            <span className="text-sm text-ivoire/70">Total estimé</span>
            <span className="font-display text-2xl text-champagne">{formatFCFA(total)}</span>
          </div>
          <p className="mt-2 text-xs text-ivoire/40">
            {quantity} × {formatFCFA(item.priceFCFA)} × {days} jour{days > 1 ? "s" : ""}. Livraison et
            installation sur devis.
          </p>

          <a
            href={buildWhatsAppLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-6 block w-full rounded-full bg-champagne px-6 py-3 text-center text-sm font-semibold text-nuit transition-colors hover:bg-champagne-light"
          >
            Réserver sur WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DecorationCatalog() {
  const [selected, setSelected] = useState<DecorationItem | null>(null);

  return (
    <>
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
                style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 p-5 text-center">
              <h3 className="font-display text-lg text-ivoire">{item.name}</h3>
              {item.variant && <p className="text-sm text-ivoire/60">{item.variant}</p>}
              <p className="text-xs text-ivoire/40">{item.availability}</p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="focus-ring inline-block rounded-full border border-champagne px-4 py-2 text-sm text-champagne transition-colors hover:bg-champagne hover:text-nuit"
                  aria-label={`Réserver ${item.name} — ${formatFCFA(item.priceFCFA)} par ${item.unit}`}
                >
                  {formatFCFA(item.priceFCFA)} / {item.unit}
                </button>
                <p className="mt-2 text-xs text-ivoire/40">Cliquez sur le prix pour réserver</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <ReservationModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
