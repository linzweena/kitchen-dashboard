// Offline shell for the kitchen board. Only same-origin page files are cached;
// API calls to Google/Todoist are never intercepted (the page caches their data itself).
const CACHE = 'kitchen-board-shell-v2';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Network first (so updates arrive), but give up after 5s and serve the cached copy.
  // Always ask the server, skipping the browser's own saved copy, so updates arrive straight away.
  const fresh = req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  const network = fetch(fresh ? new Request(req.url, { cache: 'no-store', credentials: 'same-origin' }) : req).then(res => {
    if (res.ok) { const copy = res.clone(); const key = new URL(req.url); key.search = ''; caches.open(CACHE).then(c => c.put(key.href, copy)); }
    return res;
  });
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
  e.respondWith(
    Promise.race([network, timeout]).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./', { ignoreSearch: true })).then(r => r || network)
    )
  );
});
