/*
 * Service worker de SenLivraison.
 * Volontairement minimal : les pages contiennent des données privées, elles ne
 * sont donc JAMAIS mises en cache. Seuls les icônes et la page « hors
 * connexion » le sont, pour afficher un message clair sans réseau.
 */
const CACHE = "senlivraison-v2";
const OFFLINE = "/hors-ligne.html";
const ASSETS = [OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  const url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});

/* Notifications push (nouvelles inscriptions, etc.). */
self.addEventListener("push", (event) => {
  let data = { title: "SenLivraison", body: "", url: "/notifications" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* message sans contenu lisible : texte par défaut */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
      lang: "fr",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/notifications";
  const target = new URL(path.startsWith("/") ? path : "/notifications", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(self.location.origin) && "focus" in w) {
          w.navigate(target);
          return w.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
