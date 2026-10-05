'use strict';
/* Catat — vanilla JS. Data lokal di IndexedDB, tanpa request jaringan. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const CATS={out:['Makan','Transport','Belanja','Tagihan','Hiburan','Kesehatan','Lainnya'],in:['Gaji','Bonus','Hadiah','Lainnya']};
const MAX=9999999999,NOTE=60,fmt=new Intl.NumberFormat('id-ID');
/* Durasi gerak (ms). D = --d3 di CSS; CLOSE = waktu sheet menutup; NUM = hitung angka */
const D=500,D2=250,CLOSE=260,NUM=650;/* D2 = --d2 */
const rp=n=>(n<0?'−':'')+'Rp\u00A0'+fmt.format(Math.abs(n));
const RM=matchMedia('(prefers-reduced-motion:reduce)'),rm=()=>RM.matches;
const sleep=ms=>new Promise(r=>setTimeout(r,rm()?0:ms));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>ymd(new Date());
const parse=s=>new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10));
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&ymd(parse(s))===s;
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{}};
const newId=()=>{const r=new Uint32Array(1);crypto.getRandomValues(r);return Date.now().toString(36)+r[0].toString(36).slice(0,5)};
const cmp=(a,b)=>a.date===b.date?(a.id<b.id?1:-1):(a.date<b.date?1:-1);
const sum=(m,ty)=>m.reduce((s,t)=>t.type===ty?s+t.amount:s,0);
const yday=()=>{const d=new Date();d.setDate(d.getDate()-1);return ymd(d)};
const dayLabel=s=>s===today()?'Hari ini':s===yday()?'Kemarin':parse(s).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
/* Buat elemen tanpa innerHTML: teks selalu lewat text node (aman dari XSS). */
const h=(tag,p={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(p))k.startsWith('on')?e.addEventListener(k.slice(2),v):e.setAttribute(k,v);e.append(...kids.filter(x=>x!=null&&x!==false));return e};

/* Validasi satu transaksi (dipakai form & Import). Mengembalikan objek bersih atau null. */
function clean(t){
  if(!t||typeof t!=='object')return null;
  const{id,type,amount,cat,date}=t,note=t.note==null?'':t.note;
  if(typeof id!=='string'||!/^[\w-]{1,40}$/.test(id))return null;
  if(type!=='in'&&type!=='out')return null;
  if(!CATS[type].includes(cat))return null;
  if(!Number.isInteger(amount)||amount<1||amount>MAX)return null;
  if(typeof note!=='string'||note.length>NOTE)return null;
  if(typeof date!=='string'||!validDate(date))return null;
  return{id,type,amount,cat,note:note.trim(),date};
}

/* IndexedDB */
let db;
const openDB=()=>new Promise((ok,no)=>{const r=indexedDB.open('catat',1);r.onupgradeneeded=()=>r.result.createObjectStore('tx',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const getAll=()=>new Promise((ok,no)=>{const r=db.transaction('tx').objectStore('tx').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const write=fn=>new Promise((ok,no)=>{const t=db.transaction('tx','readwrite');fn(t.objectStore('tx'));t.oncomplete=ok;t.onerror=t.onabort=()=>no(t.error)});
const dbPut=t=>write(s=>s.put(t));
const dbDel=id=>write(s=>s.delete(id));
const dbBulk=l=>write(s=>l.forEach(t=>s.put(t)));

/* State */
let all=[],ym=today().slice(0,7),tab='home',ed=null,f={},enterId=null,undo=null,tt,fx=true,dx=0,lastYm='';
const inMonth=()=>all.filter(t=>t.date.startsWith(ym));

/* Angka berhitung naik/turun ke nilai baru; kalau dipotong di tengah, lanjut dari angka yang sedang tampil */
const cnt=new WeakMap();
function count(el,to,f,snap){
  const s=cnt.get(el)||{cur:null,id:0},from=s.cur,id=++s.id;cnt.set(el,s);
  if(snap||from===null||from===to||rm()){s.cur=to;el.textContent=f(to);return}
  const t0=performance.now();
  (function step(t){
    const p=Math.min(1,(t-t0)/NUM);
    s.cur=p<1?Math.round(from+(to-from)*(1-(1-p)**4)):to;
    el.textContent=f(s.cur);
    if(p<1&&id===s.id)requestAnimationFrame(step);
  })(t0);
}

/* Judul bulan: teks lama bergeser keluar, teks baru bergeser masuk dari sisi sebaliknya */
const NS='http://www.w3.org/2000/svg';
/* panah ▾ kecil ikut bergeser bersama teks bulan */
function chev(){const s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');s.setAttribute('class','i');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');p.setAttribute('d','M6 9l6 6 6-6');s.append(p);return s}
function setMon(txt,anim){
  const m=$('#monT'),cur=m.querySelector('.cur');
  $('#monlive').textContent=txt;
  if(!cur){m.replaceChildren(h('span',{class:'cur'},txt,chev()));return}
  if(cur.textContent===txt)return;
  m.querySelectorAll('.old').forEach(e=>e.remove());
  if(!anim){cur.firstChild.nodeValue=txt;return}
  m.style.setProperty('--d',dx);
  cur.className='old';cur.setAttribute('aria-hidden','true');
  m.append(h('span',{class:'cur go'},txt,chev()));
  setTimeout(()=>cur.remove(),300);
}
/* Geser bulan ala halaman: hanya daftar (Beranda) atau rincian (Ringkasan) yang bergeser. Judul bulan bergeser sendiri; kartu saldo diam dan angkanya berhitung. */
const pane=()=>tab==='home'?$('#list'):$('#cats');
const blank=()=>tab==='home'?!!$('#list .empty'):!$('#cats .br');
const EZ='cubic-bezier(.32,.72,0,1)';
function clearSlide(){$$('.ghost').forEach(g=>g.remove());pane().getAnimations().forEach(a=>a.cancel())}
function slidePrep(){
  clearSlide();
  const p=pane();if(rm()||!p.firstElementChild)return null;
  const par=p.parentNode,pr=par.getBoundingClientRect(),r=p.getBoundingClientRect();
  const g=p.cloneNode(true);g.removeAttribute('id');g.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  g.classList.add('ghost');g.setAttribute('aria-hidden','true');g.inert=true;
  Object.assign(g.style,{top:r.top-pr.top+'px',left:r.left-pr.left+'px',width:r.width+'px'});
  par.append(g);
  return{g,h:r.height};
}
function slideRun(x,n){
  if(!x)return;const p=pane(),W=p.offsetWidth+32;
  x.g.animate([{transform:'translate3d(0,0,0)',opacity:1,filter:'blur(0)'},{transform:`translate3d(${-n*W}px,0,0)`,opacity:0,filter:'blur(8px)'}],{duration:D*.8,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'}).onfinish=()=>x.g.remove();
  p.animate([{transform:`translate3d(${n*W}px,0,0)`,opacity:0,filter:'blur(8px)'},{transform:'translate3d(0,0,0)',opacity:1,filter:'blur(0)'}],{duration:D,easing:EZ,fill:'backwards'});
  /* tinggi Ringkasan ikut berubah halus supaya blok di bawahnya tidak melompat */
  if(p.id==='cats'){const h=p.offsetHeight;if(Math.abs(h-x.h)>1)p.animate([{height:x.h+'px'},{height:h+'px'}],{duration:D,easing:EZ})}
}

/* Render */
function render(){
  const mv=ym!==lastYm&&!!lastYm&&!rm();
  if(mv)dx=ym>lastYm?1:-1;
  setMon(parse(ym+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'}),mv);lastYm=ym;
  $('#next').disabled=ym>=today().slice(0,7);$('#tabs').dataset.t=tab;
  $('#home').hidden=tab!=='home';$('#sum').hidden=tab!=='sum';
  $$('.tab').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===tab)));
  tab==='home'?renderHome():renderSum();
  enter();fx=false;
}
const row=t=>h('button',{class:'tx'+(t.id===enterId?' enter':''),'data-id':t.id,onclick:()=>openSheet(t)},
  h('span',{class:'mono','aria-hidden':'true'},t.cat[0]),
  h('span',{},h('b',{},t.cat),t.note?h('small',{},t.note):null),
  h('span',{class:t.type==='in'?'plus':'minus'},(t.type==='in'?'+':'−')+rp(t.amount)));
function renderHome(){
  const m=inMonth(),inc=sum(m,'in'),out=sum(m,'out');
  count($('#bal'),inc-out,rp,fx);
  count($('#inc'),inc,v=>(v?'+':'')+rp(v),fx);
  count($('#out'),out,v=>(v?'−':'')+rp(v),fx);
  $('#nudge').hidden=!(new Date().getDate()>=25&&all.length&&ls('catat.bk')!==today().slice(0,7));
  const list=$('#list');list.replaceChildren();
  if(!m.length){
    list.append(h('div',{class:'empty'},h('div',{class:'eico','aria-hidden':'true'},'Rp'),h('p',{},all.length?'Belum ada catatan bulan ini':'Belum ada catatan'),h('p',{class:'mut'},'Semua catatan tersimpan di perangkatmu.'),
      h('button',{class:'pri',onclick:()=>openSheet()},all.length?'Tambah catatan':'Tambah catatan pertama')));
    return;
  }
  const g={};m.sort(cmp).forEach(t=>(g[t.date]??=[]).push(t));
  for(const d in g)list.append(h('h2',{class:'day'},dayLabel(d)),h('div',{class:'card'},...g[d].map(row)));
}
/* Masuk bertahap hanya saat membuka aplikasi atau pindah tab, bukan tiap simpan atau pindah bulan */
function enter(){
  if(!fx||rm())return;
  const seq=[];
  for(const e of $(tab==='home'?'#home':'#sum').children){
    if(e.hidden||e.classList.contains('ghost'))continue;
    e.id==='list'||e.id==='cats'?seq.push(...e.children):seq.push(e);
  }
  seq.forEach((e,i)=>{e.classList.remove('rise');e.style.setProperty('--i',Math.min(i,8));e.style.setProperty('--dx',dx*20+'px')});
  void document.body.offsetWidth;
  seq.forEach(e=>e.classList.add('rise'));
}
function renderSum(){
  const m=inMonth(),box=$('#cats'),bars=[];box.replaceChildren();
  for(const[type,title]of[['out','Pengeluaran'],['in','Pemasukan']]){
    const tot=sum(m,type),by={};
    m.forEach(t=>{if(t.type===type)by[t.cat]=(by[t.cat]||0)+t.amount});
    const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]);
    const head=[h('small',{class:'mut'},title),h('p',{class:'sumtot'},rp(tot))];
    if(!rows.length){box.append(h('div',{class:'card p16 mt'},...head,h('p',{class:'mut'},'Belum ada data bulan ini.')));continue}
    box.append(h('div',{class:'card p16 mt'},...head,...rows.map(([c,v])=>{
      const p=Math.round(v/tot*100),fill=h('div',{class:'fill'});bars.push([fill,p]);
      return h('div',{class:'br'},h('div',{},h('span',{},`${c} · ${p}%`),h('b',{},rp(v))),h('div',{class:'track'},fill));
    })));
  }
  bars.forEach(([f,p],i)=>{f.style.setProperty('--i',i);if(fx)requestAnimationFrame(()=>requestAnimationFrame(()=>f.style.width=p+'%'));else{f.style.transition='none';f.style.width=p+'%'}});
}
function jump(month){const n=month>ym?1:-1,was=blank();dx=n;const x=slidePrep();fx=false;ym=month;render();
  /* kosong ke kosong: tidak perlu geser, isinya sama saja */
  if(x&&was&&blank())x.g.remove();else slideRun(x,n)}
const shift=n=>jump(ymd(new Date(+ym.slice(0,4),+ym.slice(5,7)-1+n,1)).slice(0,7));
/* Tampilkan bulan tempat sebuah catatan berada: dari tab lain masuk bertahap, dari bulan lain bergeser */
function reveal(month){
  if(tab!=='home'){tab='home';dx=-1;fx=true;ym=month;render()}
  else if(month!==ym)jump(month);
  else render();
}

/* Snackbar */
function toast(msg,act,fn){
  clearTimeout(tt);const t=$('#toast');t.replaceChildren(h('span',{},msg));
  if(act)t.append(h('button',{type:'button',onclick:fn},act));
  t.classList.add('show');tt=setTimeout(hideToast,act?6000:3500);
}
function hideToast(){$('#toast').classList.remove('show');undo=null}

/* Bottom sheet input */
const sheet=$('#sheet');
/* Keyboard tetap terbuka saat mengetuk Keluar/Masuk, kategori, atau memilih tanggal: fokus dikembalikan ke kolom terakhir */
/* Aturan keyboard: terbuka otomatis hanya saat mencatat baru (nominal adalah langkah pertama). Mengganti Keluar/Masuk atau kategori mempertahankan keadaan keyboard apa adanya. Setelah memilih tanggal, kursor pindah ke nominal hanya jika nominal masih kosong. */
let lf=null,kbWas=false;const keep=()=>{if(kbWas)(lf||$('#amt')).focus({preventScroll:true})};
sheet.addEventListener('pointerdown',()=>{const a=document.activeElement;kbWas=!!a&&a.matches('#amt,#note')},true);
sheet.addEventListener('focusin',e=>{if(e.target.matches('#amt,#note'))lf=e.target});
sheet.addEventListener('mousedown',e=>{if(e.target.closest('.seg button,.chip'))e.preventDefault()});
const dateText=v=>{if(!validDate(v))return 'Pilih tanggal';const d=parse(v),full=d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
  return (v===today()?'Hari ini':v===yday()?'Kemarin':d.toLocaleDateString('id-ID',{weekday:'short'}))+', '+full};
function chips(){$('#chips').replaceChildren(...CATS[f.type].map(c=>h('button',{type:'button',class:'chip',onclick:()=>{f.cat=c;paint();keep()}},c)))}
function paint(){
  const a=$('#amt'),bx=$('#amtbox');a.value=f.amt?fmt.format(+f.amt):'';bx.classList.toggle('has',!!f.amt);
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===f.type)));
  $$('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===f.cat)));
  $('.seg').dataset.v=f.type;bx.style.fontSize=Math.min(52,Math.floor(560/Math.max(a.value.length+3,6)))+'px';const rl=$('#ruler');rl.textContent=a.value||'0';a.style.width=rl.offsetWidth+3+'px';$('#dl').textContent=dateText($('#date').value);
  $('#ok').disabled=!f.amt;$('#err').textContent='';
}
function openSheet(t){
  ed=t||null;
  f=t?{type:t.type,amt:String(t.amount),cat:t.cat}:{type:'out',amt:'',cat:CATS.out[0]};
  $('#note').value=t?t.note:'';$('#date').value=t?t.date:today();
  $('#st').textContent=t?'Ubah catatan':'Catatan baru';$('#sh-del').hidden=!t;
  lf=null;chips();paint();hideToast();
  if(!t)$('#kb').focus({preventScroll:true});/* buka keyboard di dalam gestur ketuk, lalu pindahkan ke nominal */
  sheet.showModal();place();t?sheet.focus({preventScroll:true}):$('#amt').focus({preventScroll:true});settle();
  $('.chip[aria-pressed=true]')?.scrollIntoView({inline:'center',block:'nearest'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.classList.add('show');if(!t)$('#amt').focus({preventScroll:true});paint()}));
}
function closeSheet(){sheet.classList.remove('show');setTimeout(()=>sheet.open&&sheet.close(),rm()?0:CLOSE)}
async function save(){
  if(!f.amt)return;
  const t=clean({id:ed?ed.id:newId(),type:f.type,amount:+f.amt,cat:f.cat,note:$('#note').value.trim(),date:$('#date').value});
  if(!t){$('#err').textContent='Tanggalnya belum benar. Pilih tanggal lagi.';return}
  $('#ok').disabled=true;
  try{await dbPut(t)}catch{$('#ok').disabled=false;$('#err').textContent='Gagal menyimpan. Coba lagi.';return}
  const i=all.findIndex(x=>x.id===t.id);i<0?all.push(t):all[i]=t;
  if(!ed)enterId=t.id;
  closeSheet();reveal(t.date.slice(0,7));enterId=null;
}
async function del(){
  const t=ed;closeSheet();
  try{await dbDel(t.id)}catch{toast('Gagal menghapus. Coba lagi.');return}
  await sleep(CLOSE);
  const el=$$('.tx').find(e=>e.dataset.id===t.id);
  if(el){el.classList.add('leave');await sleep(200)}
  all=all.filter(x=>x.id!==t.id);undo=t;render();
  toast('Catatan dihapus','Kembalikan',restore);
}
async function restore(){
  const t=undo;if(!t)return;undo=null;
  try{await dbPut(t)}catch{toast('Gagal mengembalikan catatan. Coba lagi.');return}
  all.push(t);enterId=t.id;reveal(t.date.slice(0,7));enterId=null;hideToast();
}

/* Picker bulan/tahun: dialog kecil seperti sheet. Titik = bulan atau tahun yang punya catatan (dari data di memori).
   Ketuk tahun di bagian atas untuk membuka daftar tahun; titik di sana menunjukkan tahun mana saja yang ada catatannya. */
const pkd=$('#pick'),MS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
let py=0,pHas=new Set(),pYrs=new Set(),pBusy=false,pv='m';
const nowYm=()=>today().slice(0,7);
function paintPick(){
  const cur=nowYm(),cy=+cur.slice(0,4),cm=+cur.slice(5,7),yh=pYrs.has(String(py));
  $('#pyt').textContent=py;$('#py-next').disabled=py>=cy;
  const yb=$('#py');yh?yb.setAttribute('data-d','1'):yb.removeAttribute('data-d');
  yb.setAttribute('aria-label',`Tahun ${py}${yh?', ada catatan':''}. Ketuk untuk memilih tahun`);
  $('#mg').replaceChildren(...MS.map((s,i)=>{
    const v=`${py}-${pad(i+1)}`,has=pHas.has(v),off=py>cy||(py===cy&&i+1>cm);
    const name=parse(v+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'});
    return h('button',{type:'button',class:'mo','aria-pressed':String(v===ym),'aria-label':name+(has?', ada catatan':''),...(has?{'data-d':'1'}:{}),...(off?{disabled:''}:{}),onclick:()=>choose(v)},s);
  }));
}
/* daftar tahun: dari tahun tertua yang punya catatan sampai tahun ini (maksimal 12 tahun terakhir) */
function paintYears(){
  const cy=+nowYm().slice(0,4),first=Math.max(Math.min(cy,...[...pYrs].map(Number)),cy-11),ys=[];
  for(let y=first;y<=cy;y++)ys.push(y);
  $('#yg').replaceChildren(...ys.map(y=>{const has=pYrs.has(String(y));
    return h('button',{type:'button',class:'mo','aria-pressed':String(String(y)===ym.slice(0,4)),'aria-label':`${y}${has?', ada catatan':''}`,...(has?{'data-d':'1'}:{}),onclick:()=>{py=y;viewPick('m')}},String(y))}));
}
function viewPick(v,focus=true){
  pv=v;const yv=v==='y';
  pkd.classList.toggle('yv',yv);$('#py').setAttribute('aria-expanded',String(yv));
  $('#mg').hidden=yv;$('#yg').hidden=!yv;
  paintPick();if(yv)paintYears();
  const box=yv?$('#yg'):$('#mg');
  if(!rm())box.animate([{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'none'}],{duration:D2,easing:EZ});
  if(focus)(box.querySelector('[aria-pressed=true]:not(:disabled)')||$('#py')).focus({preventScroll:true});
}
function openPick(){
  if(pkd.open||sheet.open)return;
  py=+ym.slice(0,4);pHas=new Set(all.map(t=>t.date.slice(0,7)));pYrs=new Set(all.map(t=>t.date.slice(0,4)));
  pv='m';pkd.classList.remove('yv');$('#py').setAttribute('aria-expanded','false');$('#mg').hidden=false;$('#yg').hidden=true;paintPick();
  pkd.showModal();
  $('.mo[aria-pressed=true]')?.focus({preventScroll:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>pkd.classList.add('show')));
}
/* tutup dengan animasi, kembalikan fokus ke judul bulan, lalu jalankan `then` */
async function closePick(then){
  if(!pkd.open||pBusy)return;pBusy=true;
  pkd.classList.remove('show');await sleep(CLOSE);
  if(pkd.open)pkd.close();
  pBusy=false;$('#mon').focus({preventScroll:true});then?.();
}
const choose=v=>v===ym?closePick():closePick(()=>jump(v));
function stepYear(n){
  py+=n;paintPick();
  if(!rm())$('#mg').animate([{opacity:0,transform:`translate3d(${n*16}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:D2,easing:EZ});
}

/* Geser horizontal di daftar: kiri = bulan berikutnya, kanan = sebelumnya. Hanya sentuh/pena; gulir vertikal tidak terganggu. */
const SW_MIN=48,SW_RATIO=1.5,SPR='cubic-bezier(.34,1.45,.5,1)';let noClick=0;
function hold(el){/* di bulan terakhir: daftar bergeser sedikit lalu melenting kembali */
  if(rm())return;
  el.animate([{transform:'translate3d(0,0,0)',easing:EZ},{transform:'translate3d(-14px,0,0)',offset:.3,easing:SPR},{transform:'translate3d(0,0,0)'}],{duration:D});
}
function swipe(el){
  let id=null,x0=0,y0=0;
  el.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||!e.isPrimary||sheet.open||pkd.open){id=null;return}
    id=e.pointerId;x0=e.clientX;y0=e.clientY;
  });
  el.addEventListener('pointercancel',()=>{id=null});
  el.addEventListener('pointerup',e=>{
    if(e.pointerId!==id)return;id=null;
    if(sheet.open||pkd.open)return;
    const dx=e.clientX-x0,dy=e.clientY-y0;
    if(Math.abs(dx)<SW_MIN||Math.abs(dx)<=SW_RATIO*Math.abs(dy))return;
    noClick=performance.now()+350;/* geseran bukan ketukan baris */
    if(dx<0&&ym>=nowYm()){hold(el);return}
    shift(dx<0?1:-1);
  });
  el.addEventListener('click',e=>{if(performance.now()<noClick){e.preventDefault();e.stopPropagation()}},true);
}

/* Cadangan JSON */
function exportJSON(){
  const data=JSON.stringify({app:'catat',v:1,exported:new Date().toISOString(),tx:all},null,1);
  const a=h('a',{href:URL.createObjectURL(new Blob([data],{type:'application/json'})),download:`catat-${today()}.json`});
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true;toast('Cadangan disimpan sebagai file .json.');
}
async function importJSON(file){
  try{
    if(file.size>5e6)throw 0;
    const j=JSON.parse(await file.text());
    if(!j||j.app!=='catat'||j.v!==1||!Array.isArray(j.tx)||j.tx.length>1e5)throw 0;
    const list=j.tx.map(clean);if(list.includes(null))throw 0;
    await dbBulk(list);
    const m=new Map(all.map(t=>[t.id,t]));list.forEach(t=>m.set(t.id,t));all=[...m.values()];
    render();toast(`${list.length} catatan dipulihkan.`);
  }catch{toast('File ini bukan cadangan Catat. Pilih file .json dari "Simpan cadangan".')}
}

/* Event */
$('#prev').onclick=()=>shift(-1);$('#next').onclick=()=>shift(1);
$$('.tab').forEach(b=>b.onclick=()=>{if(tabNC()||tab===b.dataset.t)return;dx=b.dataset.t==='sum'?1:-1;fx=true;tab=b.dataset.t;render()});
$('#add').onclick=()=>openSheet();
$('#mon').onclick=openPick;
$('#pk-cl').onclick=()=>closePick();
$('#pk-now').onclick=()=>choose(nowYm());
$('#py-prev').onclick=()=>stepYear(-1);
$('#py').onclick=()=>viewPick(pv==='y'?'m':'y');
$('#py-next').onclick=e=>{stepYear(1);if(e.currentTarget.disabled)$('#py-prev').focus({preventScroll:true})};
pkd.addEventListener('click',e=>{if(e.target===pkd)closePick()});
pkd.addEventListener('cancel',e=>{e.preventDefault();closePick()});
pkd.addEventListener('close',()=>pkd.classList.remove('show'));
swipe($('#list'));swipe($('#cats'));
function setType(t){f.type=t;if(!CATS[t].includes(f.cat))f.cat=CATS[t][0];chips();paint();keep()}
$$('.seg button').forEach(b=>b.onclick=()=>{if(segNC()||f.type===b.dataset.type)return;setType(b.dataset.type)});
/* Nominal: kolom teks biasa + keyboard angka bawaan; diformat Rp saat mengetik */
$('#amt').addEventListener('input',e=>{f.amt=e.target.value.replace(/\D/g,'').replace(/^0+/,'').slice(0,10);paint()});
/* Jendela melayang: dihitung dari visual viewport supaya selalu duduk di atas keyboard (dan bar bantu iOS) */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const sab=h('div',{class:'sab','aria-hidden':'true'});document.body.append(sab);
let pr=0;
function place(){
  if(!sheet.open)return;
  const v=window.visualViewport||{height:innerHeight,offsetTop:0},kb=Math.max(0,innerHeight-v.height-v.offsetTop),open=kb>80,acc=open&&IOS?56:0;
  const gap=open?10:(parseFloat(getComputedStyle(sab).paddingBottom)||0)+12;
  sheet.style.bottom='auto';
  sheet.style.maxHeight=Math.max(240,v.height-acc-gap-12)+'px';
  sheet.style.top=Math.max(8,v.offsetTop+v.height-acc-gap-sheet.offsetHeight)+'px';
}
const settle=()=>{cancelAnimationFrame(pr);const t0=performance.now();(function f(){place();if(performance.now()-t0<900)pr=requestAnimationFrame(f)})()};
if(window.visualViewport){visualViewport.addEventListener('resize',place);visualViewport.addEventListener('scroll',place)}
addEventListener('resize',place);
sheet.addEventListener('focusin',settle);sheet.addEventListener('focusout',settle);
new ResizeObserver(place).observe(sheet);
$('#date').addEventListener('change',()=>{paint();if(!f.amt)setTimeout(()=>$('#amt').focus({preventScroll:true}),80)});
$('#date').addEventListener('click',e=>{if(matchMedia('(pointer:fine)').matches)try{e.target.showPicker()}catch{}});
$('#amtbox').addEventListener('click',()=>$('#amt').focus({preventScroll:true}));
$('#note').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f.amt?save():$('#amt').focus()}});
$('#amt').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save()}});
$('#ok').onclick=save;$('#sh-del').onclick=del;$('#cl').onclick=closeSheet;
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
sheet.addEventListener('close',()=>sheet.classList.remove('show'));
$('#ex').onclick=exportJSON;$('#nb').onclick=exportJSON;
$('#im').onclick=()=>$('#file').click();
$('#file').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(fl)importJSON(fl)};
$('#nx').onclick=()=>{ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true};

/* Slider kaca (tab bar & Keluar/Masuk): tekan = lensa mengembang; geser = lensa mengikuti jari dengan pegas, lalu mengunci ke segmen terdekat */
function liquid(root,els,cur,pick){
  let x0=0,x=0,t0=0,vx=0,b=0,down=false,drag=false,nc=false,ck=0,tk=0,tv=0,raf=0;
  const rub=k=>k<0?k*.08:k>1?1+(k-1)*.08:k,sw=()=>(root.clientWidth-8)/2;
  const paint=()=>{root.style.setProperty('--k',Math.max(-.03,Math.min(1.03,ck)).toFixed(4));if(down)els.forEach((e,i)=>e.style.setProperty('--s',(1+.12*Math.max(0,1-Math.abs(ck-i)*1.1)).toFixed(3)))};
  const done=()=>{root.classList.remove('drive');root.style.removeProperty('--k')};
  function step(){
    if(rm()){ck=tk;tv=0}else{tv=(tv+(tk-ck)*.1)*.68;ck+=tv}
    paint();
    if(Math.abs(tk-ck)>.002||Math.abs(tv)>.002)raf=requestAnimationFrame(step);
    else{raf=0;ck=tk;paint();if(!down)done()}
  }
  const run=()=>{raf||(raf=requestAnimationFrame(step))};
  root.addEventListener('pointerdown',e=>{
    down=true;drag=false;x0=x=e.clientX;t0=performance.now();vx=0;
    b=ck=tk=cur();tv=0;root.classList.add('lens','drive');paint();
  });
  root.addEventListener('pointermove',e=>{
    if(!down)return;
    if(!drag){if(Math.abs(e.clientX-x0)<6)return;drag=true;root.setPointerCapture(e.pointerId);x=e.clientX;t0=performance.now()}
    const now=performance.now();
    if(now>t0)vx=.6*vx+.4*(e.clientX-x)/(now-t0);
    x=e.clientX;t0=now;
    tk=rub(b+(e.clientX-x0)/sw());run();
  });
  const end=()=>{
    if(!down)return;down=false;
    root.classList.remove('lens');els.forEach(e=>e.style.removeProperty('--s'));
    if(!drag){done();return}
    drag=false;nc=true;setTimeout(()=>nc=false,60);
    const to=tk+vx*120/sw()>.5?1:0;
    tk=to;run();
    if(to!==cur())pick(to);
  };
  ['pointerup','pointercancel'].forEach(t=>root.addEventListener(t,end));
  return()=>nc;
}
const tabNC=liquid($('#tabs'),[...$$('.tab')],()=>tab==='sum'?1:0,i=>{dx=i?1:-1;fx=true;tab=i?'sum':'home';render()});
const segNC=liquid($('.seg'),[...$$('.seg button')],()=>f.type==='in'?1:0,i=>setType(i?'in':'out'));
/* Kilau kaca mengikuti jari/kursor: dihitung satu kali per frame */
let lq=null;
const litFlush=()=>{const q=lq;lq=null;if(!q)return;const r=q.g.getBoundingClientRect();q.g.style.setProperty('--mx',(q.x-r.left)/r.width*100+'%');q.g.style.setProperty('--my',(q.y-r.top)/r.height*100+'%')};
const lit=e=>{const g=e.target.closest?.('.glass');if(!g)return;if(!lq)requestAnimationFrame(litFlush);lq={g,x:e.clientX,y:e.clientY}};
document.addEventListener('pointerdown',lit,{passive:true});document.addEventListener('pointermove',lit,{passive:true});

/* Tema: Otomatis / Terang / Gelap. Disimpan di perangkat; pindah dengan pudar halus. */
const TH=window.catatTheme;
function paintTheme(){
  const m=TH?TH.get():'auto';
  $('#theme').dataset.n=String(['auto','light','dark'].indexOf(m));
  $$('#theme button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.th===m)));
}
function setTheme(m){
  if(!TH||TH.get()===m)return;
  const go=()=>{TH.set(m);paintTheme()};
  if(rm()){go();return}
  if(document.startViewTransition){document.startViewTransition(go);return}
  const r=document.documentElement;r.classList.add('thx');go();setTimeout(()=>r.classList.remove('thx'),400);
}
$$('#theme button').forEach(b=>b.onclick=()=>setTheme(b.dataset.th));
addEventListener('storage',e=>{if(e.key==='catat.theme'&&TH){TH.apply(TH.get());paintTheme()}});
paintTheme();

/* Mulai */
(async()=>{
  navigator.storage?.persist?.();
  try{db=await openDB();all=(await getAll()).map(clean).filter(Boolean)}catch{toast('Browser ini tidak bisa menyimpan data. Matikan mode privat atau coba browser lain.')}
  render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
