import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrackingCard, TrackingNotFound, TrackShell } from "@/components/TrackingCard";
import { publicTracking, trackingPath } from "@/lib/shipments";

export const metadata: Metadata = { title: "Suivi de colis" };
export const dynamic = "force-dynamic";

/**
 * /suivi/<boutique>/<numéro> : lien de suivi au nom de la boutique.
 * Si le nom ne correspond pas à la boutique du colis, on redirige vers le bon
 * lien (impossible de fabriquer un lien avec un faux nom de boutique).
 */
export default async function NamedTrackPage({ params }: { params: Promise<{ numero: string; code: string }> }) {
  const { numero: slug, code } = await params;
  const t = publicTracking(decodeURIComponent(code));
  if (!t) return <TrackShell><TrackingNotFound /></TrackShell>;
  const path = trackingPath(t.tracking_number, t.merchant_name);
  if (path !== `/suivi/${decodeURIComponent(slug)}/${t.tracking_number}`) redirect(path);
  return (
    <TrackShell>
      <TrackingCard t={t} />
    </TrackShell>
  );
}
