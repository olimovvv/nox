// ════════════════════════════════════════════════════════
// NOX — service worker
// Offline shell + web push notifications.
// Deploy: shu fayl index.html bilan bir xil papkada (root) turishi shart.
// ════════════════════════════════════════════════════════

const CACHE = "nox-v9-art-entry";

self.addEventListener("install", (e) => { e.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(['/', '/assets/planner.css','/assets/workspace.css','/assets/workspace-art.svg','/assets/artwork-entry.js','/assets/arc-ascent.svg','/assets/arc-mark.svg','/assets/arcs.css','/assets/arcs.js','/assets/arcs-core.js','/assets/daily-horizon.svg','/assets/planner-core.js','/assets/planner-live.js','/assets/planner-vendor/confetti.js','/assets/planner-vendor/fadeInUp.css','/assets/planner-vendor/fadeOutRight.css','/assets/planner.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2']);
    await self.skipWaiting();
  })()); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("nox-v") && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// network-first for page navigations, cached shell as offline fallback
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Cache only public shell assets, never authenticated API responses or user uploads.
  if(url.href==='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'){
    e.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href))||fetch(e.request)));return;
  }
  if(e.request.method==='GET' && url.origin===self.location.origin && /\.(?:js|css|woff2|png|svg|ico)$/.test(url.pathname) && !url.pathname.includes('/storage/')){
    e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const r=await fetch(e.request);if(r.ok)await cache.put(e.request,r.clone());return r;}catch{return await cache.match(e.request)||Response.error();}})());return;
  }
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request);
        const cache = await caches.open(CACHE);
        if(fresh.ok && (url.pathname==='/' || url.pathname==='/index.html'))await cache.put("/", fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match("/");
        return cached || Response.error();
      }
    })());
  }
});

// page stores its language into Cache Storage ("/nox-prefs") so push
// notifications can be localized even when the site is fully closed
const PUSH_TEXT = {
  en: { title: "Nox", body: "⏰ A task deadline is coming up — open Nox to see it." },
  uz: { title: "Nox", body: "⏰ Task muddati yaqinlashmoqda — Nox'ni ochib ko'ring." },
  ru: { title: "Nox", body: "⏰ Приближается срок задачи — откройте Nox." }
};

async function getLang() {
  try {
    const res = await caches.match("/nox-prefs");
    if (res) { const j = await res.json(); if (j && j.lang) return j.lang; }
  } catch (_) {}
  return "en";
}

self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let data = null;
    try { data = e.data ? e.data.json() : null; } catch (_) {}
    const lang = await getLang();
    const txt = PUSH_TEXT[lang] || PUSH_TEXT.en;
    await self.registration.showNotification((data && data.title) || txt.title, {
      body: (data && data.body) || txt.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: (data && data.tag) || "nox-reminder"
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("/");
  })());
});
