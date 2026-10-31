// Offline werking: de app zelf wordt bij installatie bewaard, lettertypes bij het eerste gebruik.
// Verhoog VERSION bij elke wijziging aan index.html, zodat toestellen de nieuwe versie ophalen.
const VERSION = "v2";
const CACHE = "aanrijdingshulp-" + VERSION;
const APP = ["./", "index.html", "manifest.json", "icon.png"];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("aanrijdingshulp-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pagina: eerst netwerk, zonder bereik de bewaarde versie.
  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); return res; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // Lettertypes en eigen bestanden: eerst de bewaarde versie.
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isFont || url.origin === location.origin) {
    ev.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
