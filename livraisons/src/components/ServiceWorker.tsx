"use client";

import { useEffect } from "react";

/** Enregistre le service worker (installation de l'application, page hors connexion). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Sans service worker, l'application fonctionne normalement en ligne. */
    });
  }, []);
  return null;
}
