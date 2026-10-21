"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";

// Valeur affichée par défaut = valeur finale : le HTML livré aux moteurs de
// recherche, aux aperçus de liens et aux navigateurs sans JavaScript contient
// donc les vrais chiffres (et non « 0 »). L'animation de comptage ne démarre
// que si le compteur était hors de l'écran au chargement de la page.
function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, durationMs]);

  return value;
}

function Counter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // armed : le compteur était hors écran au chargement → on l'anime à son arrivée
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          if (entry.isIntersecting) {
            // déjà visible au chargement : on garde la valeur finale, sans animation
            observer.disconnect();
            return;
          }
          setArmed(true);
          return;
        }
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const animated = useCountUp(value, active);
  const isYear = label.toLowerCase().includes("année");
  const shown = isYear || !armed ? value : animated;

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl text-champagne md:text-5xl">
        {isYear ? shown : shown.toLocaleString("fr-FR")}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-ivoire/60">{label}</p>
    </div>
  );
}

export default function StatsCounters() {
  const count = siteConfig.stats.length;
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
      {siteConfig.stats.map((stat, i) => (
        <div
          key={stat.label}
          className={i === count - 1 && count % 2 === 1 ? "col-span-2 md:col-span-1" : ""}
        >
          <Counter value={stat.value} suffix={stat.suffix} label={stat.label} />
        </div>
      ))}
    </div>
  );
}
