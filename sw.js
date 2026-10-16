const CACHE='pitaka-v28';
const CORE=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png'];
// QR reader and drawer, loaded by the page only when a QR is used; saved here so they work offline
const LIBS=['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js','https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'];
const FONT_CSS='https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap';
// Save the font stylesheet and the font files it points to, so text looks the same offline from the first visit
async function cacheFonts(c){
  try{
    const r=await fetch(FONT_CSS,{mode:'cors'});
    if(!r.ok)return;
    await c.put(FONT_CSS,r.clone());
    const urls=[...(await r.text()).matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]);
    await Promise.all(urls.map(u=>fetch(u,{mode:'cors'}).then(f=>f.ok&&c.put(u,f)).catch(()=>{})));
  }catch(e){}
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).then(()=>Promise.all([cacheFonts(c),...LIBS.map(u=>fetch(u,{mode:'cors'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{}))]))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // Pages: network first so updates show up, cache as fallback offline.
  // Give up on the network after 4s so a weak signal doesn't leave a blank screen.
  if(e.request.mode==='navigate'){
    e.respondWith(Promise.race([
      fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c))}return r}),
      new Promise((_,no)=>setTimeout(no,4000))
    ]).catch(()=>caches.match('index.html')));
    return;
  }
  // Everything else (icons, bank logos, Google Fonts, QR libraries): cache first. ignoreSearch so links with ?fbclid etc. still hit the cache
  if(url.origin===location.origin||url.hostname.endsWith('gstatic.com')||url.hostname.endsWith('googleapis.com')||url.hostname==='cdn.jsdelivr.net'){
    e.respondWith(caches.match(e.request,{ignoreSearch:url.origin===location.origin,ignoreVary:true}).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})));
  }
});
