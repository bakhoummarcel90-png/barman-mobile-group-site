"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { deletePushSubscriptionAction, savePushSubscriptionAction } from "@/app/actions";
import type { FormState } from "@/lib/validation";
import { Alert } from "./ui";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "ios-not-installed" | "denied" | "off" | "on";

/** Active / désactive les notifications push sur l'appareil courant. */
export function PushSettings({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FormState>({});

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setStatus(ios && !standalone ? "ios-not-installed" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setStatus(sub ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setResult({});
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const r = await savePushSubscriptionAction({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
      setResult(r);
      setStatus(r.ok ? "on" : "off");
    } catch {
      setResult({ ok: false, message: "Impossible d'activer les notifications sur ce navigateur." });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      setResult({ ok: true, message: "Notifications désactivées sur cet appareil." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {result.message ? <Alert tone={result.ok ? "success" : "danger"}>{result.message}</Alert> : null}
      {status === "loading" ? <p className="text-sm text-ink-muted">Vérification…</p> : null}
      {status === "ios-not-installed" ? (
        <Alert tone="warning">
          Sur iPhone, les notifications ne marchent que dans l'application installée : ouvrez SenLivraison dans Safari → Partager →
          « Sur l'écran d'accueil », puis ouvrez l'icône et revenez ici (iOS 16.4 ou plus récent).
        </Alert>
      ) : null}
      {status === "unsupported" ? <Alert tone="warning">Ce navigateur ne prend pas en charge les notifications. Essayez Chrome, Edge, Firefox ou Safari récent.</Alert> : null}
      {status === "denied" ? (
        <Alert tone="warning">
          Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur (icône à gauche de l'adresse → Notifications →
          Autoriser), puis rechargez la page.
        </Alert>
      ) : null}
      {status === "off" ? (
        <button type="button" className="btn-primary" onClick={enable} disabled={busy}>
          <BellRing className="h-4 w-4" aria-hidden /> {busy ? "Activation…" : "Activer les notifications sur cet appareil"}
        </button>
      ) : null}
      {status === "on" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-emerald-700">✓ Activées sur cet appareil</span>
          <button type="button" className="btn-secondary btn-sm" onClick={disable} disabled={busy}>
            <BellOff className="h-4 w-4" aria-hidden /> Désactiver
          </button>
        </div>
      ) : null}
    </div>
  );
}
