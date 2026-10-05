'use strict';
/* Catat — vanilla JS. Data lokal di IndexedDB, tanpa request jaringan. */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const CATS={out:['Makan','Transport','Belanja','Tagihan','Hiburan','Kesehatan','Lainnya'],in:['Gaji','Bonus','Hadiah','Lainnya']};
const MAX=9999999999,NOTE=60,fmt=new Intl.NumberFormat('id-ID');
const rp=n=>(n<0?'−':'')+'Rp\u00A0'+fmt.format(Math.abs(n));
const rm=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const sleep=ms=>new Promise(r=>setTimeout(r,rm()?0:ms));
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
let all=[],ym=today().slice(0,7),tab='home',ed=null,f={},shown=null,tw=0,enterId=null,undo=null,tt;
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
  $('#next').disabled=ym>=today().slice(0,7);
  $('#home').hidden=tab!=='home';$('#sum').hidden=tab!=='sum';
  $$('.tab').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===tab)));
  tab==='home'?renderHome():renderSum();
}
const row=t=>h('button',{class:'tx'+(t.id===enterId?' enter':''),'data-id':t.id,onclick:()=>openSheet(t)},
  h('span',{},h('b',{},t.cat),t.note?h('small',{},t.note):null),
  h('span',{class:t.type==='in'?'plus':'minus'},(t.type==='in'?'+':'−')+rp(t.amount)));
function renderHome(){
  const m=inMonth(),inc=sum(m,'in'),out=sum(m,'out');
  tween($('#bal'),inc-out);
  $('#inc').textContent='+'+rp(inc);$('#out').textContent='−'+rp(out);
  $('#nudge').hidden=!(new Date().getDate()>=25&&all.length&&ls('catat.bk')!==today().slice(0,7));
  const list=$('#list');list.replaceChildren();
  if(!m.length){
    list.append(h('div',{class:'empty'},h('p',{},all.length?'Belum ada catatan bulan ini':'Belum ada catatan'),
      h('button',{class:'pri',onclick:()=>openSheet()},all.length?'Catat pengeluaran':'Catat pengeluaran pertamamu')));
    return;
  }
  const g={};m.sort(cmp).forEach(t=>(g[t.date]??=[]).push(t));
  for(const d in g)list.append(h('h2',{class:'day'},dayLabel(d)),h('div',{class:'card'},...g[d].map(row)));
}
function renderSum(){
  const m=inMonth(),box=$('#cats');box.replaceChildren();
  for(const[type,title]of[['out','Pengeluaran'],['in','Pemasukan']]){
    const tot=sum(m,type),by={};
    m.forEach(t=>{if(t.type===type)by[t.cat]=(by[t.cat]||0)+t.amount});
    box.append(h('h2',{class:'day'},`${title} · ${rp(tot)}`));
    const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]);
    if(!rows.length){box.append(h('p',{class:'mut'},'Belum ada data bulan ini.'));continue}
    box.append(h('div',{class:'card p16'},...rows.map(([c,v])=>{
      const p=Math.round(v/tot*100),fill=h('div',{class:'fill'});fill.style.width=p+'%';
      return h('div',{class:'br'},h('div',{},h('span',{},`${c} · ${p}%`),h('b',{},rp(v))),h('div',{class:'track'},fill));
    })));
  }
}
const shift=n=>{ym=ymd(new Date(+ym.slice(0,4),+ym.slice(5,7)-1+n,1)).slice(0,7);render()};

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
  $('#ok').disabled=!f.amt;$('#err').textContent='';
}
function openSheet(t){
  ed=t||null;
  f=t?{type:t.type,amt:String(t.amount),cat:t.cat}:{type:'out',amt:'',cat:CATS.out[0]};
  $('#note').value=t?t.note:'';$('#date').value=t?t.date:today();
  $('#st').textContent=t?'Ubah catatan':'Catatan baru';$('#sh-del').hidden=!t;
  chips();paint();hideToast();
  sheet.showModal();$('#amt').focus({preventScroll:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('show')));
}
function closeSheet(){sheet.classList.remove('show');setTimeout(()=>sheet.open&&sheet.close(),rm()?0:230)}
function key(k){
  if(k==='⌫')f.amt=f.amt.slice(0,-1);
  else{const n=(f.amt+k).replace(/^0+/,'');if(n.length<=10)f.amt=n}
  paint();
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
$$('.tab').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
$('#add').onclick=()=>openSheet();
$$('.seg button').forEach(b=>b.onclick=()=>{f.type=b.dataset.type;if(!CATS[f.type].includes(f.cat))f.cat=CATS[f.type][0];chips();paint()});
['1','2','3','4','5','6','7','8','9','000','0','⌫'].forEach(k=>$('#keys').append(h('button',{type:'button',class:'key','aria-label':k==='⌫'?'Hapus satu angka':k,onclick:()=>key(k)},k)));
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

/* Mulai */
(async()=>{
  navigator.storage?.persist?.();
  try{db=await openDB();all=(await getAll()).map(clean).filter(Boolean)}catch{toast('Penyimpanan tidak tersedia di browser ini.')}
  render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
