'use strict';
/* Catat — vanilla JS. Data lokal di IndexedDB, tanpa request jaringan. */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const CATS={out:['Makan','Transport','Belanja','Tagihan','Hiburan','Kesehatan','Lainnya'],in:['Gaji','Bonus','Hadiah','Lainnya']};
const MAX=9999999999,NOTE=60,fmt=new Intl.NumberFormat('id-ID');
const rp=n=>(n<0?'−':'')+'Rp\u00A0'+fmt.format(Math.abs(n));
const rm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,rm()?0:ms));
const replay=(e,c)=>{e.classList.remove(c);void e.offsetWidth;e.classList.add(c)};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>ymd(new Date());
const parse=s=>new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10));
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&ymd(parse(s))===s;
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{}};
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const cmp=(a,b)=>a.date===b.date?(a.id<b.id?1:-1):(a.date<b.date?1:-1);
const sum=(m,ty)=>m.reduce((s,t)=>t.type===ty?s+t.amount:s,0);
const dayLabel=s=>s===today()?'Hari ini':s===ymd(new Date(Date.now()-864e5))?'Kemarin':parse(s).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
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
let all=[],ym=today().slice(0,7),tab='home',ed=null,f={},shown=null,tw=0,enterId=null,undo=null,tt,fx=true,dx=0,lastYm='';
const inMonth=()=>all.filter(t=>t.date.startsWith(ym));

/* Saldo berhitung halus ke nilai baru */
function tween(el,to){
  const from=shown,id=++tw;shown=to;
  if(from===null||from===to||rm()){el.textContent=rp(to);return}
  const t0=performance.now();
  (function step(t){const p=Math.min(1,(t-t0)/250);el.textContent=rp(Math.round(from+(to-from)*(1-(1-p)**3)));if(p<1&&id===tw)requestAnimationFrame(step)})(t0);
}

/* Render */
function render(){
  $('#mon').textContent=parse(ym+'-01').toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  if(ym!==lastYm){if(lastYm){$('#mon').style.setProperty('--dx',dx*22+'px');replay($('#mon'),'sw')}lastYm=ym}
  $('#next').disabled=ym>=today().slice(0,7);$('#tabs').dataset.t=tab;
  $('#home').hidden=tab!=='home';$('#sum').hidden=tab!=='sum';
  $$('.tab').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===tab)));
  tab==='home'?renderHome():renderSum();
  fx=false;
}
const row=t=>h('button',{class:'tx'+(t.id===enterId?' enter':''),'data-id':t.id,onclick:()=>openSheet(t)},
  h('span',{class:'mono','aria-hidden':'true'},t.cat[0]),
  h('span',{},h('b',{},t.cat),t.note?h('small',{},t.note):null),
  h('span',{class:t.type==='in'?'plus':'minus'},(t.type==='in'?'+':'−')+rp(t.amount)));
function renderHome(){
  const m=inMonth(),inc=sum(m,'in'),out=sum(m,'out');
  tween($('#bal'),inc-out);
  $('#inc').textContent='+'+rp(inc);$('#out').textContent='−'+rp(out);
  $('#nudge').hidden=!(new Date().getDate()>=25&&all.length&&ls('catat.bk')!==today().slice(0,7));
  const list=$('#list');list.replaceChildren();
  if(!m.length){
    list.append(h('div',{class:'empty'},h('div',{class:'eico','aria-hidden':'true'},'Rp'),h('p',{},all.length?'Belum ada catatan bulan ini':'Belum ada catatan'),h('p',{class:'mut'},'Semua catatan tersimpan di perangkatmu.'),
      h('button',{class:'pri',onclick:()=>openSheet()},all.length?'Catat pengeluaran':'Catat pengeluaran pertamamu')));
    return;
  }
  const g={};m.sort(cmp).forEach(t=>(g[t.date]??=[]).push(t));
  for(const d in g)list.append(h('h2',{class:'day'},dayLabel(d)),h('div',{class:'card'},...g[d].map(row)));
  stagger(list);
}
/* Masuk bertahap hanya saat pindah bulan/tab, bukan tiap simpan */
function stagger(box){if(fx)[...box.children].forEach((e,i)=>{e.style.setProperty('--i',i);e.style.setProperty('--dx',dx*20+'px');e.classList.add('rise')})}
function renderSum(){
  const m=inMonth(),box=$('#cats'),bars=[];box.replaceChildren();
  slSync();
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
  stagger(box);
  bars.forEach(([f,p],i)=>{f.style.setProperty('--i',i);if(fx)requestAnimationFrame(()=>requestAnimationFrame(()=>f.style.width=p+'%'));else{f.style.transition='none';f.style.width=p+'%'}});
}
const shift=n=>{dx=n;fx=true;ym=ymd(new Date(+ym.slice(0,4),+ym.slice(5,7)-1+n,1)).slice(0,7);render()};

/* Snackbar */
function toast(msg,act,fn){
  clearTimeout(tt);const t=$('#toast');t.replaceChildren(h('span',{},msg));
  if(act)t.append(h('button',{type:'button',onclick:fn},act));
  t.classList.add('show');tt=setTimeout(hideToast,act?6000:3500);
}
function hideToast(){$('#toast').classList.remove('show');undo=null}

/* Bottom sheet input */
const sheet=$('#sheet');
function chips(){$('#chips').replaceChildren(...CATS[f.type].map(c=>h('button',{type:'button',class:'chip',onclick:()=>{f.cat=c;paint()}},c)))}
function paint(){
  const a=$('#amt');a.textContent=f.amt?rp(+f.amt):'Rp\u00A00';a.classList.toggle('mut',!f.amt);
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===f.type)));
  $$('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===f.cat)));
  $('.seg').dataset.v=f.type;a.style.fontSize=Math.min(52,Math.floor(540/a.textContent.length))+'px';
  $('#ok').disabled=!f.amt;$('#err').textContent='';
}
function openSheet(t){
  ed=t||null;
  f=t?{type:t.type,amt:String(t.amount),cat:t.cat}:{type:'out',amt:'',cat:CATS.out[0]};
  $('#note').value=t?t.note:'';$('#date').value=t?t.date:today();
  $('#st').textContent=t?'Ubah catatan':'Catatan baru';$('#sh-del').hidden=!t;
  chips();paint();hideToast();
  sheet.showModal();$('#amt').focus({preventScroll:true});
  $('.chip[aria-pressed=true]')?.scrollIntoView({inline:'center',block:'nearest'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('show')));
}
function closeSheet(){sheet.classList.remove('show');setTimeout(()=>sheet.open&&sheet.close(),rm()?0:230)}
function key(k){
  if(k==='⌫')f.amt=f.amt.slice(0,-1);
  else{const n=(f.amt+k).replace(/^0+/,'');if(n.length<=10)f.amt=n}
  paint();replay($('#amt'),'bump');
}
async function save(){
  if(!f.amt)return;
  const t=clean({id:ed?ed.id:newId(),type:f.type,amount:+f.amt,cat:f.cat,note:$('#note').value.trim(),date:$('#date').value});
  if(!t){$('#err').textContent='Pilih tanggal yang benar, lalu coba lagi.';return}
  $('#ok').disabled=true;
  try{await dbPut(t)}catch{$('#ok').disabled=false;$('#err').textContent='Gagal menyimpan. Coba lagi.';return}
  const i=all.findIndex(x=>x.id===t.id);i<0?all.push(t):all[i]=t;
  if(!ed)enterId=t.id;
  ym=t.date.slice(0,7);tab='home';closeSheet();render();enterId=null;
}
async function del(){
  const t=ed;closeSheet();
  try{await dbDel(t.id)}catch{toast('Gagal menghapus. Coba lagi.');return}
  await sleep(230);
  const el=document.querySelector(`[data-id="${t.id}"]`);
  if(el){el.classList.add('leave');await sleep(190)}
  all=all.filter(x=>x.id!==t.id);undo=t;render();
  toast('Catatan dihapus','Urungkan',restore);
}
async function restore(){
  const t=undo;if(!t)return;undo=null;
  try{await dbPut(t)}catch{toast('Gagal mengurungkan.');return}
  all.push(t);enterId=t.id;ym=t.date.slice(0,7);tab='home';render();enterId=null;hideToast();
}

/* Cadangan JSON */
function exportJSON(){
  const data=JSON.stringify({app:'catat',v:1,exported:new Date().toISOString(),tx:all},null,1);
  const a=h('a',{href:URL.createObjectURL(new Blob([data],{type:'application/json'})),download:`catat-${today()}.json`});
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true;toast('Cadangan disimpan di perangkatmu.');
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
  }catch{toast('File tidak cocok. Pilih file cadangan Catat (.json).')}
}

/* Event */
$('#prev').onclick=()=>shift(-1);$('#next').onclick=()=>shift(1);
$$('.tab').forEach(b=>b.onclick=()=>{if(noClick||tab===b.dataset.t)return;dx=b.dataset.t==='sum'?1:-1;fx=true;tab=b.dataset.t;render()});
$('#add').onclick=()=>openSheet();
$$('.seg button').forEach(b=>b.onclick=()=>{f.type=b.dataset.type;if(!CATS[f.type].includes(f.cat))f.cat=CATS[f.type][0];chips();paint()});
['1','2','3','4','5','6','7','8','9','000','0'].forEach(k=>$('#keys').append(h('button',{type:'button',class:'key',onclick:()=>key(k)},k)));
$('#keys').append($('#bs'));
$('#bs').onclick=()=>key('⌫');
$('#amt').addEventListener('keydown',e=>{
  if(/^\d$/.test(e.key))key(e.key);else if(e.key==='Backspace')key('⌫');else if(e.key==='Enter')save();else return;
  e.preventDefault();
});
$('#ok').onclick=save;$('#sh-del').onclick=del;$('#cl').onclick=closeSheet;
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
sheet.addEventListener('close',()=>sheet.classList.remove('show'));
$('#ex').onclick=exportJSON;$('#nb').onclick=exportJSON;
$('#im').onclick=()=>$('#file').click();
$('#file').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(fl)importJSON(fl)};
$('#nx').onclick=()=>{ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true};

/* Slider bulan: thumb = lensa yang mengembang saat disentuh dan melar mengikuti kecepatan. Pointer events sendiri (input range native tak andal di iOS). */
const sld=$('#sld'),SW=44;let sp=1,sv=0,sr=0,sdrag=false,sidx=11;
const monthAt=i=>{const n=new Date();return ymd(new Date(n.getFullYear(),n.getMonth()-(11-i),1)).slice(0,7)};
function slShow(p,quiet){
  sld.style.setProperty('--p',p);
  if(!quiet)sv=Math.max(-.5,Math.min(.5,sv+(p-sp)*6));
  sp=p;
  if(!sr&&!rm())sr=requestAnimationFrame(function k(){sv*=.8;const a=Math.abs(sv);sld.style.setProperty('--st',a<.01?0:a.toFixed(3));sr=a<.01?0:requestAnimationFrame(k)});
}
function slSync(){
  const n=new Date(),d=(n.getFullYear()-+ym.slice(0,4))*12+n.getMonth()+1-+ym.slice(5,7),lb=parse(ym+'-01').toLocaleDateString('id-ID',{month:'short',year:'numeric'});
  sidx=Math.max(0,Math.min(11,11-d));
  $('#sl-v').textContent=lb;sld.setAttribute('aria-valuenow',sidx);sld.setAttribute('aria-valuetext',lb);
  if(!sdrag)slShow(sidx/11,true);
}
function slGo(i){if(i===sidx)return;sidx=i;dx=0;ym=monthAt(i);render()}
const slX=e=>{const r=sld.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left-SW/2)/(r.width-SW)))};
const slMove=e=>{const p=slX(e);slShow(p);slGo(Math.round(p*11))};
sld.addEventListener('pointerdown',e=>{sdrag=true;sld.setPointerCapture(e.pointerId);sld.classList.add('drag');slMove(e)});
sld.addEventListener('pointermove',e=>{if(sdrag)slMove(e)});
const slEnd=()=>{if(!sdrag)return;sdrag=false;sld.classList.remove('drag');slShow(sidx/11,true)};
['pointerup','pointercancel','lostpointercapture'].forEach(t=>sld.addEventListener(t,slEnd));
sld.addEventListener('keydown',e=>{
  const k={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];
  if(e.key==='Home')slGo(0);else if(e.key==='End')slGo(11);else if(k)slGo(Math.max(0,Math.min(11,sidx+k)));else return;
  e.preventDefault();
});
/* Tab bar: tekan = lensa mengembang, geser = lensa ikut jari lalu mengunci ke tab terdekat */
const tabs=$('#tabs');let tx=0,tk=0,tdown=false,tdrag=false,noClick=false;
function lens(k){tk=k;tabs.style.setProperty('--k',k.toFixed(3));$$('.tab').forEach((b,i)=>b.style.setProperty('--s',(1+.16*Math.max(0,1-Math.abs(k-i)*1.1)).toFixed(3)))}
tabs.addEventListener('pointerdown',e=>{tdown=true;tdrag=false;tx=e.clientX;tabs.classList.add('lens');lens(tab==='sum'?1:0)});
tabs.addEventListener('pointermove',e=>{
  if(!tdown)return;
  if(!tdrag){if(Math.abs(e.clientX-tx)<6)return;tdrag=true;tabs.setPointerCapture(e.pointerId);tabs.classList.add('drag')}
  const r=tabs.getBoundingClientRect(),w=(r.width-10)/2;
  lens(Math.max(0,Math.min(1,(e.clientX-r.left-5-w/2)/w)));
});
const tEnd=()=>{
  if(!tdown)return;tdown=false;
  const was=tdrag,to=tk>.5?'sum':'home';tdrag=false;
  tabs.classList.remove('lens','drag');tabs.style.removeProperty('--k');$$('.tab').forEach(b=>b.style.removeProperty('--s'));
  if(was){noClick=true;setTimeout(()=>noClick=false,60);if(to!==tab){dx=to==='sum'?1:-1;fx=true;tab=to;render()}}
};
['pointerup','pointercancel'].forEach(t=>tabs.addEventListener(t,tEnd));
/* Kilau kaca mengikuti jari/kursor */
const lit=e=>{const g=e.target.closest?.('.glass');if(!g)return;const r=g.getBoundingClientRect();g.style.setProperty('--mx',(e.clientX-r.left)/r.width*100+'%');g.style.setProperty('--my',(e.clientY-r.top)/r.height*100+'%')};
document.addEventListener('pointerdown',lit);document.addEventListener('pointermove',lit);

/* Mulai */
(async()=>{
  navigator.storage?.persist?.();
  try{db=await openDB();all=(await getAll()).map(clean).filter(Boolean)}catch{toast('Penyimpanan tidak tersedia di browser ini.')}
  render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
