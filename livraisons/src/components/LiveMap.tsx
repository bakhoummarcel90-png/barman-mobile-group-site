"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  color: string;
}

/**
 * Carte OpenStreetMap (gratuite, sans clé) avec des points colorés :
 * départ, arrivée (positions approximatives des quartiers) et livreur (GPS).
 */
export function LiveMap({ points, height = 260 }: { points: MapPoint[]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(points);
  useEffect(() => {
    if (!el.current || !points.length) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const latlngs: [number, number][] = [];
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], { radius: 9, color: "#fff", weight: 2, fillColor: p.color, fillOpacity: 1 })
          .addTo(map)
          .bindTooltip(p.label, { permanent: points.length <= 3, direction: "top", offset: [0, -8] });
        latlngs.push([p.lat, p.lng]);
      }
      if (latlngs.length === 1) map.setView(latlngs[0], 15);
      else map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 15 });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!points.length) return null;
  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-xl border border-slate-200" aria-label="Carte" />;
}
