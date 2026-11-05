/* =====================================================================
   sw.js — the service worker that makes Inkbrawl a proper home-screen app.

   Add Inkbrawl to the home screen (Share → Add to Home Screen on iPad,
   the install prompt on Android) and it opens full-screen, in its own
   window, and keeps working with no network at all.

   How it caches:
     - the page itself (index.html) is network-first: a new deploy is
       picked up on the next launch, and the cached copy is the offline
       fallback;
     - the core scripts are stale-while-revalidate: served instantly from
       the cache, refreshed in the background for the next launch;
     - everything else the game fetches (weapon PNGs, biome scripts,
       manifest.json lists…) is cached the first time it is used, so
       every part of the game you have already played works offline.

   When you update the repo, bump CACHE below so players get the new
   build on their next visit.
   ===================================================================== */
'use strict';

const CACHE = 'inkbrawl-v8';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './content.js', './expansion.js', './weather.js', './world.js',
  './build.js', './modes.js', './menu.js', './ui3d.js', './admin.js',
  './mainmenu/bg.png', './mainmenu/maintitle.png',
  './mainmenu/event/bg.png', './mainmenu/event/maintitle.png', './mainmenu/event/event.json',
  './weapons/manifest.json', './biomes/manifest.json', './biomes2/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(u => c.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // GitHub's API etc.: network only

  if (req.mode === 'navigate' || req.destination === 'document') {
    // the page: fresh when online, the cached copy when not
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(CACHE);
        c.put('./index.html', r.clone());
        return r;
      } catch (err) {
        const hit = (await caches.match(req)) || (await caches.match('./index.html'));
        if (hit) return hit;
        return new Response('offline', { status: 503 });
      }
    })());
    return;
  }

  // everything else: cache-first, refreshed quietly in the background
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) {
      const stale = fetch(req).then(async r => {
        if (r && r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
        return r;
      }).catch(() => null);
      e.waitUntil(stale);
      return hit;
    }
    try {
      const r = await fetch(req);
      if (r && r.ok && (r.type === 'basic' || r.type === 'default')) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
      return r;
    } catch (err) {
      return new Response('offline', { status: 503 });
    }
  })());
});
