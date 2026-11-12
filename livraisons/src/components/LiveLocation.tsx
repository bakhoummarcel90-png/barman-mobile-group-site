"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MapPin } from "lucide-react";
import { reportPositionAction } from "@/app/actions";

/**
 * Partage la position GPS du livreur pendant la course (toutes les 30 s),
 * tant que cette page est ouverte sur son téléphone. Le client la voit sur
 * son lien de suivi. Aucune position n'est envoyée en dehors des courses.
 */
export function LiveLocation({ deliveryId }: { deliveryId: number }) {
  // Lu seulement dans le navigateur (le serveur suppose « disponible » : pas d'écart d'affichage).
  const supported = useSyncExternalStore(
    () => () => {},
    () => "geolocation" in navigator,
    () => true,
  );
  const [watchState, setState] = useState<"off" | "on" | "denied">("off");
  const state = supported ? watchState : "unsupported";
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let lastSent = 0;
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setState("on");
        if (Date.now() - lastSent < 30_000) return;
        lastSent = Date.now();
        const r = await reportPositionAction(deliveryId, pos.coords.latitude, pos.coords.longitude);
        if (r.ok) setLast(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "off"),
      { enableHighAccuracy: true, maximumAge: 20_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [deliveryId]);

  return (
    <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${state === "on" ? "text-emerald-600" : "text-ink-muted"}`} aria-hidden />
      <span className="text-ink-soft">
        {state === "on"
          ? `Position partagée avec le client pendant la course${last ? ` (dernier envoi ${last})` : ""}. Gardez cette page ouverte.`
          : state === "denied"
            ? "Localisation refusée : autorisez-la dans les réglages du téléphone pour que le client vous suive sur la carte."
            : state === "unsupported"
              ? "Ce téléphone ne permet pas le partage de position."
              : "Activation de la localisation… acceptez la demande du téléphone."}
      </span>
    </div>
  );
}
