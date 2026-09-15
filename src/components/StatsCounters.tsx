"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";

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
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
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

  const displayed = useCountUp(value, active);
  const isYear = label.toLowerCase().includes("année");

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl text-champagne md:text-5xl">
        {isYear ? value : displayed.toLocaleString("fr-FR")}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-ivoire/60">{label}</p>
    </div>
  );
}

export default function StatsCounters() {
  return (
    <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
      {siteConfig.stats.map((stat) => (
        <Counter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
      ))}
    </div>
  );
}
