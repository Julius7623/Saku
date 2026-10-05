/* Service worker: precache + stale-while-revalidate, jalan offline. Tambah file baru ke daftar A dan naikkan V. */
const V='catat-v12',A=['./','index.html','assets/style.css','assets/app.js','assets/icon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(V),hit=await c.match(r);
    /* perbarui cache di belakang layar; hanya simpan respons sukses dari server sendiri */
    const net=fetch(r).then(res=>{if(res.ok&&res.type==='basic')c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||(r.mode==='navigate'?c.match('index.html'):Response.error());
  })());
});
