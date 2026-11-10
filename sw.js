// Garde le site en mémoire pour qu'il s'ouvre même sans réseau (dans la cuisine, au magasin).
// Les pages et scripts du site : d'abord le réseau (pour avoir la dernière version), sinon la copie gardée.
// Polices et bibliothèques extérieures : la copie gardée d'abord.
var VERSION = "repas-v4";
var BASE = ["./", "./index.html", "./manifest.webmanifest", "./icone-192.png", "./icone-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request; if (r.method !== "GET") return;
  var u = new URL(r.url);
  var chez = u.origin === self.location.origin;
  var externe = /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host);
  if (!chez && !externe) return;
  if (chez) {
    e.respondWith(fetch(r).then(function (rep) {
      if (rep.ok) { var copie = rep.clone(); caches.open(VERSION).then(function (c) { c.put(r, copie); }); }
      return rep;
    }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || (r.mode === "navigate" ? caches.match("./") : undefined); });
    }));
  } else {
    e.respondWith(caches.match(r).then(function (m) {
      return m || fetch(r).then(function (rep) { var copie = rep.clone(); caches.open(VERSION).then(function (c) { c.put(r, copie); }); return rep; });
    }));
  }
});
