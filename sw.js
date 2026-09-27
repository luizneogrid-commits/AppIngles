// Service worker: app funciona offline depois da primeira visita.
const CACHE = "fluencia-v20";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const same = req.url.startsWith(self.location.origin);
  // Rede primeiro (pega atualizações), cache como reserva offline.
  // Arquivos do próprio app: "no-cache" revalida com o servidor em vez de usar a cópia HTTP de até 10 min.
  const net = !same ? fetch(req)
    : req.mode === "navigate" ? fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
    : fetch(req, { cache: "no-cache" });
  e.respondWith(
    net.then(res => {
      if (res.ok && (same || req.url.includes("fonts.g"))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
