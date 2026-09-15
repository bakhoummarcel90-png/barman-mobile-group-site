import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/config/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="focus-ring group flex flex-col justify-between rounded-2xl border border-champagne/15 bg-nuit-soft p-7 transition-colors hover:border-champagne/40 hover:bg-nuit-light"
    >
      <div>
        <h3 className="font-display text-xl text-ivoire">{service.shortName}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ivoire/60">{service.tagline}</p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm text-champagne">
        Découvrir
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}
