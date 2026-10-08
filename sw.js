// Capiagest · service worker
// - La app abre aunque no haya señal (los datos igual necesitan conexión).
// - El HTML se pide primero a la red, así cada cambio que subas a GitHub llega solo.
// - Nunca se guardan datos de Supabase.
const V='capiagest-v1';
const BASE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.hostname.endsWith('supabase.co')) return;            // datos: siempre en vivo
  const propio=u.origin===location.origin, cdn=u.hostname==='cdn.jsdelivr.net';
  if(!propio&&!cdn) return;

  const esPagina=r.mode==='navigate'||(propio&&(u.pathname.endsWith('/')||u.pathname.endsWith('index.html')));
  if(esPagina){
    e.respondWith(
      fetch(r).then(res=>{
        if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('index.html',cp));}
        return res;
      }).catch(()=>caches.match('index.html').then(h=>h||caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(r).then(hit=>hit||fetch(r).then(res=>{
      if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}
      return res;
    }))
  );
});
