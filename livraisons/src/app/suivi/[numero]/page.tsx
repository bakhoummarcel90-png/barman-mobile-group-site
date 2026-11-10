import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrackingCard, TrackingNotFound, TrackShell } from "@/components/TrackingCard";
import { publicTracking, trackingPath } from "@/lib/shipments";

export const metadata: Metadata = { title: "Suivi de colis" };
export const dynamic = "force-dynamic";

/** /suivi/SLxxxxxxxx : redirige vers le lien au nom de la boutique quand il y en a une. */
export default async function TrackPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const t = publicTracking(decodeURIComponent(numero));
  if (t?.merchant_name) {
    const path = trackingPath(t.tracking_number, t.merchant_name);
    if (path !== `/suivi/${t.tracking_number}`) redirect(path);
  }
  return <TrackShell>{t ? <TrackingCard t={t} /> : <TrackingNotFound />}</TrackShell>;
}
