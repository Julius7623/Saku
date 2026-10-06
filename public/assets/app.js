'use strict';
/* KasKu — vanilla JS. Data lokal di IndexedDB, tanpa request jaringan. */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* Kategori bawaan; pengguna bisa menambah, menghapus, dan mengurutkan sendiri (disimpan di localStorage `catat.cats`) */
/* Nama kategori bawaan disimpan dalam bahasa Indonesia (kunci tetap), lalu ditampilkan sesuai bahasa lewat cn(). */
const DEF={out:['Makan','Transportasi','Hiburan','Lainnya'],in:['Uang jajan','Gaji','Bonus','Lainnya']};
/* daftar bawaan versi lama: kalau tersimpan persis begini (belum diubah), pakai daftar bawaan baru */
const OLD={out:['Makan','Transportasi','Belanja','Tagihan','Hiburan','Kesehatan','Lainnya'],in:['Gaji','Bonus','Hadiah','Lainnya']};
const CATS={out:[...DEF.out],in:[...DEF.in]};
const MAX=9999999999,NOTE=60,CAT=20,CATV=30;
/* Durasi gerak (ms). D = --d3 di CSS; CLOSE = waktu sheet menutup; NUM = hitung angka */
const D=500,D2=250,CLOSE=260,NUM=650;/* D2 = --d2 */
const RM=matchMedia('(prefers-reduced-motion:reduce)'),rm=()=>RM.matches;
const sleep=ms=>new Promise(r=>setTimeout(r,rm()?0:ms));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>ymd(new Date());
const parse=s=>new Date(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10));
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&ymd(parse(s))===s;
const ls=(k,v)=>{try{return v===undefined?localStorage.getItem(k):localStorage.setItem(k,v)}catch{}};

/* Bahasa: Indonesia (id) atau Inggris (en). Dipilih pengguna di Ringkasan; bawaannya mengikuti bahasa perangkat. */
const EN={'Mata uang':'Currency','Hanya mengubah simbol yang ditampilkan; nominal tidak dikonversi.':'Only changes the displayed symbol; amounts are not converted.',"KasKu: pencatat keuangan pribadi": "KasKu: personal finance tracker", "Catat pemasukan dan pengeluaran harian dengan cepat. Data hanya tersimpan di perangkatmu.": "Log daily income and expenses quickly. Your data stays on your device.", "KasKu membutuhkan JavaScript. Aktifkan JavaScript di peramban, lalu muat ulang halaman.": "KasKu needs JavaScript. Enable JavaScript in your browser, then reload the page.", "Pilih bulan dan tahun": "Choose month and year", "Pindah bulan": "Change month", "Bulan sebelumnya": "Previous month", "Bulan berikutnya": "Next month", "Sisa uang bulan ini": "Money left this month", "Pemasukan": "Income", "Pengeluaran": "Expenses", "Sudah akhir bulan. Simpan cadangan datamu?": "It’s the end of the month. Back up your data?", "Cadangkan": "Back up", "Nanti": "Later", "Cari catatan atau nominal": "Search entries or amounts", "Cari catatan": "Search entries", "Kategori": "Categories", "Kelola kategori": "Manage categories", "Tambah, hapus, dan urutkan sendiri pilihan kategori pemasukan dan pengeluaran. Catatan lama tidak berubah.": "Add, delete, and reorder your income and expense categories. Existing entries stay unchanged.", "Cadangan data": "Data backup", "Simpan cadangan": "Save backup", "Pulihkan cadangan": "Restore backup", "Datamu hanya tersimpan di perangkat ini. Simpan cadangan secara berkala agar tidak hilang.": "Your data lives only on this device. Save a backup regularly so you don’t lose it.", "Tampilan": "Appearance", "Otomatis": "Auto", "Terang": "Light", "Gelap": "Dark", "Otomatis mengikuti pengaturan terang atau gelap di perangkatmu.": "Auto follows your device’s light or dark setting.", "Bahasa": "Language", "Pilih bahasa tampilan aplikasi.": "Choose the app’s display language.", "Reset": "Reset", "Reset catatan keuangan": "Reset financial records", "Menghapus semua catatan dan anggaran dari perangkat ini. Pengaturan tampilan dan kategori tidak ikut terhapus.": "Deletes all entries and budgets from this device. Appearance and category settings are kept.", "Dibuat oleh": "Made by", "Menu utama": "Main menu", "Beranda": "Home", "Ringkasan": "Summary", "Tambah catatan": "Add entry", "Batal": "Cancel", "Jenis catatan": "Entry type", "Hapus": "Delete", "Catatan baru": "New entry", "Nominal dalam rupiah": "Amount in rupiah", "Keterangan (opsional)": "Note (optional)", "Keterangan": "Note", "Tanggal": "Date", "Simpan": "Save", "Pilih tahun": "Choose year", "Tahun sebelumnya": "Previous year", "Tahun berikutnya": "Next year", "Bulan": "Month", "Bulan ini": "This month", "Nama anggaran": "Budget name", "Nominal per bulan": "Amount per month", "Anggaran per bulan dalam rupiah": "Monthly budget in rupiah", "Dihitung dari kategori": "Counted from categories", "Kategori pengeluaran yang dihitung": "Expense categories counted", "Selesai": "Done", "Ketuk − untuk menghapus, seret ≡ untuk mengubah urutan.": "Tap − to delete, drag ≡ to reorder.", "Kategori baru": "New category", "Nama kategori pengeluaran baru": "New expense category name", "Tambah": "Add", "Nama kategori pemasukan baru": "New income category name", "Reset catatan keuangan?": "Reset financial records?", "Hapus semua": "Delete all", "Simpan cadangan dulu": "Back up first", "Hari ini": "Today", "Kemarin": "Yesterday", "Tidak ada hasil": "No results", "Pencarian mencakup semua bulan.": "Search covers all months.", "Belum ada catatan bulan ini": "No entries this month", "Belum ada catatan": "No entries yet", "Semua catatan tersimpan di perangkatmu.": "All entries are stored on your device.", "Tambah catatan pertama": "Add your first entry", "Belum ada data bulan ini.": "No data this month.", "Anggaran": "Budgets", "Atur": "Edit", "Belum ada anggaran. Buat sendiri, misalnya “Makan di luar” atau “Hiburan”.": "No budgets yet. Create your own, e.g. “Eating out” or “Fun”.", "Tambah anggaran": "Add budget", "Seret ≡ untuk mengubah urutan. Ketuk − lalu Hapus untuk menghapus anggaran.": "Drag ≡ to reorder. Tap − then Delete to remove a budget.", "Dihitung dari pengeluaran di kategori yang dipilih, per bulan.": "Calculated from expenses in the selected categories, per month.", "Catatan dihapus": "Entry deleted", "Kembalikan": "Undo", "Gagal menghapus. Coba lagi.": "Couldn’t delete. Try again.", "Gagal mengembalikan catatan. Coba lagi.": "Couldn’t restore the entry. Try again.", "Pilih tanggal": "Pick a date", "Ubah catatan": "Edit entry", "Tanggal tidak boleh melewati hari ini.": "The date can’t be after today.", "Tanggalnya belum benar. Pilih tanggal lagi.": "That date isn’t valid. Pick another.", "Gagal menyimpan. Coba lagi.": "Couldn’t save. Try again.", "Ubah anggaran": "Edit budget", "Anggaran baru": "New budget", "Lengkapi nama, nominal, dan minimal satu kategori.": "Fill in a name, amount, and at least one category.", "Cadangan tersimpan": "Backup saved", "Gagal mereset. Coba lagi.": "Couldn’t reset. Try again.", "Semua catatan dihapus.": "All entries deleted.", "Gagal mengembalikan. Coba lagi.": "Couldn’t restore. Try again.", "Kembali ke pilihan bulan": "Back to months", "12 tahun sebelumnya": "Previous 12 years", "12 tahun berikutnya": "Next 12 years", "Tahun": "Year", ", ada catatan": ", has entries", "Cadangan disimpan sebagai berkas .json.": "Backup saved as a .json file.", "Berkas ini bukan cadangan KasKu. Pilih berkas .json dari “Simpan cadangan”.": "This file isn’t a KasKu backup. Choose the .json file from “Save backup”."};
const CN={'Makan':'Food','Transportasi':'Transport','Transport':'Transport','Hiburan':'Entertainment','Lainnya':'Other','Uang jajan':'Allowance','Gaji':'Salary','Bonus':'Bonus','Belanja':'Shopping','Tagihan':'Bills','Kesehatan':'Health','Hadiah':'Gift'};
const getLang=()=>{const s=ls('catat.lang');return s==='en'||s==='id'?s:(/^(id|in)\b/i.test(navigator.language||'')?'id':'en')};
let LANG=getLang();
const tr=s=>LANG==='en'?(EN[s]??s):s;
const cn=c=>LANG==='en'?(CN[c]??c):c;
const LOC=()=>LANG==='en'?'en-US':'id-ID';
let _nf=null,_nl='';
/* Mata uang: hanya simbol tampilan (tanpa konversi kurs); nominal tetap bilangan bulat. Disimpan di `catat.cur`. */
const CURS={IDR:['Rp','\u00A0'],USD:['$',''],EUR:['€',''],SGD:['S$',''],MYR:['RM','\u00A0'],JPY:['¥','']};
let CUR=(()=>{const c=ls('catat.cur');return CURS[c]?c:'IDR'})();
const rp=n=>(n<0?'−':'')+CURS[CUR][0]+CURS[CUR][1]+fmt.format(Math.abs(n));
/* pemisah ribuan mengikuti mata uang (bukan bahasa): bahasa hanya menerjemahkan teks */
const CURLOC={IDR:'id-ID',USD:'en-US',EUR:'de-DE',SGD:'en-SG',MYR:'ms-MY',JPY:'ja-JP'};
const fmt={format:n=>{const l=CURLOC[CUR]||'id-ID';if(_nl!==l){_nf=new Intl.NumberFormat(l);_nl=l}return _nf.format(n)}};
const newId=()=>{const r=new Uint32Array(1);crypto.getRandomValues(r);return Date.now().toString(36)+r[0].toString(36).slice(0,5)};
const cmp=(a,b)=>a.date===b.date?(a.id<b.id?1:-1):(a.date<b.date?1:-1);
const sum=(m,ty)=>m.reduce((s,t)=>t.type===ty?s+t.amount:s,0);
const yday=()=>{const d=new Date();d.setDate(d.getDate()-1);return ymd(d)};
const dayLabel=s=>s===today()?tr('Hari ini'):s===yday()?tr('Kemarin'):parse(s).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'});
/* Buat elemen tanpa innerHTML: teks selalu lewat text node (aman dari XSS). */
const h=(tag,p={},...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(p))k.startsWith('on')?e.addEventListener(k.slice(2),v):e.setAttribute(k,v);e.append(...kids.filter(x=>x!=null&&x!==false));return e};

/* Nama kategori: rapikan spasi; daftar tanpa duplikat (huruf besar/kecil dianggap sama) */
const catName=s=>typeof s==='string'?s.trim().replace(/\s+/g,' '):'';
const catSame=(a,b)=>a.toLowerCase()===b.toLowerCase();
function catList(a){const r=[];if(Array.isArray(a))for(const x of a){const c=catName(x);if(c&&c.length<=CAT&&!r.some(y=>catSame(y,c)))r.push(c)}return r}
function catLoad(){try{const j=JSON.parse(ls('catat.cats')||'null');if(j&&typeof j==='object')for(const t of['out','in']){const l=catList(j[t]);if(l.length&&JSON.stringify(l)!==JSON.stringify(OLD[t]))CATS[t]=l}}catch{}}
const catSave=()=>ls('catat.cats',JSON.stringify(CATS));
/* kategori yang sudah dihapus tetap tampil pada catatan lama */
const catsFor=(type,cur)=>!cur||CATS[type].includes(cur)?CATS[type]:[...CATS[type],cur];

/* Validasi satu transaksi (dipakai form & Import). Mengembalikan objek bersih atau null. */
function clean(t){
  if(!t||typeof t!=='object')return null;
  const{id,type,amount,cat,date}=t,note=t.note==null?'':t.note;
  if(typeof id!=='string'||!/^[\w-]{1,40}$/.test(id))return null;
  if(type!=='in'&&type!=='out')return null;
  if(typeof cat!=='string'||!cat.trim()||cat.length>CATV)return null;
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
let all=[],ym=today().slice(0,7),tab='home',ed=null,f={},enterId=null,undo=null,undoAll=null,tt,fx=true,dx=0,lastYm='',bEdit=false,bArm=null;
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
function chevR(){const s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');s.setAttribute('class','i chev');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');p.setAttribute('d','M9 6l6 6-6 6');s.append(p);return s}
function ico(d){const s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');s.setAttribute('class','i');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');p.setAttribute('d',d);s.append(p);return s}
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
  if(tab!=='sum'){bEdit=false;bArm=null}
  const mv=ym!==lastYm&&!!lastYm&&!rm();
  if(mv)dx=ym>lastYm?1:-1;
  setMon(parse(ym+'-01').toLocaleDateString(LOC(),{month:'long',year:'numeric'}),mv);lastYm=ym;
  $('#next').disabled=ym>=today().slice(0,7);{const mn=parse(ym+'-01').toLocaleDateString(LOC(),{month:'long'});$('#balL').textContent=ym===today().slice(0,7)?(LANG==='en'?'Money left this month':'Sisa uang bulan ini'):(LANG==='en'?'Money left in '+mn:'Sisa uang bulan '+mn)}$('#tabs').dataset.t=tab;
  $('#home').hidden=tab!=='home';$('#sum').hidden=tab!=='sum';
  $$('.tab').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===tab)));
  tab==='home'?renderHome():renderSum();
  enter();fx=false;
}
const row=t=>h('button',{class:'tx'+(t.id===enterId?' enter':''),'data-id':t.id,onclick:e=>openSheet(t,e.currentTarget)},
  h('span',{class:'mono','aria-hidden':'true'},[...cn(t.cat)][0].toUpperCase()),
  h('span',{},h('b',{},cn(t.cat)),t.note?h('small',{},t.note):null),
  h('span',{class:t.type==='in'?'plus':'minus'},(t.type==='in'?'+':'−')+rp(t.amount)));
const qv=()=>$('#q').value.trim().toLowerCase();
const hit=(t,q)=>t.cat.toLowerCase().includes(q)||cn(t.cat).toLowerCase().includes(q)||t.note.toLowerCase().includes(q)||String(t.amount).includes(q.replace(/\D/g,'')||'\0');
function renderHome(){
  const m0=inMonth(),inc=sum(m0,'in'),out=sum(m0,'out'),q=qv(),m=q?all.filter(t=>hit(t,q)):m0;
  $('#sq').hidden=!all.length;
  count($('#bal'),inc-out,rp,fx);
  count($('#inc'),inc,v=>(v?'+':'')+rp(v),fx);
  count($('#out'),out,v=>(v?'−':'')+rp(v),fx);
  $('#bal').classList.toggle('sm',Math.abs(inc-out)>=1e8);$('#inc').classList.toggle('sm',inc>=1e8);$('#out').classList.toggle('sm',out>=1e8);
  $('#nudge').hidden=!(new Date().getDate()>=25&&all.length&&ls('catat.bk')!==today().slice(0,7));
  const list=$('#list');list.replaceChildren();
  if(q&&!m.length){list.append(h('div',{class:'empty'},h('p',{},tr('Tidak ada hasil')),h('p',{class:'mut'},tr('Pencarian mencakup semua bulan.'))));return}
  if(!m.length){
    list.append(h('div',{class:'empty'},h('div',{class:'eico','aria-hidden':'true'},CURS[CUR][0]),h('p',{},all.length?tr('Belum ada catatan bulan ini'):tr('Belum ada catatan')),h('p',{class:'mut'},tr('Semua catatan tersimpan di perangkatmu.')),
      h('button',{class:'pri',onclick:e=>openSheet(null,e.currentTarget)},all.length?tr('Tambah catatan'):tr('Tambah catatan pertama'))));
    return;
  }
  const g={};m.sort(cmp).forEach(t=>(g[t.date]??=[]).push(t));
  for(const d in g)list.append(h('h2',{class:'day'},q?parse(d).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short',year:'numeric'}):dayLabel(d)),h('div',{class:'card'},...g[d].map(row)));
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
  for(const[type,title]of[['out',tr('Pengeluaran')],['in',tr('Pemasukan')]]){
    const tot=sum(m,type),by={};
    m.forEach(t=>{if(t.type===type)by[t.cat]=(by[t.cat]||0)+t.amount});
    const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]);
    const head=[h('small',{class:'mut'},title),h('p',{class:'sumtot'},rp(tot))];
    if(!rows.length){box.append(h('div',{class:'card p16 mt'},...head,h('p',{class:'mut'},tr('Belum ada data bulan ini.'))));continue}
    box.append(h('div',{class:'card p16 mt'},...head,...rows.map(([c,v])=>{
      const p=Math.round(v/tot*100),fill=h('div',{class:'fill'});bars.push([fill,p]);
      return h('div',{class:'br'},h('div',{},h('span',{},`${cn(c)} · ${p}%`),h('b',{},rp(v))),h('div',{class:'track'},fill));
    })));
  }
  const bg=bdGet();
  if(!bg.length){bEdit=false;bArm=null}
  box.append(h('div',{class:'dh'},h('h2',{class:'day'},tr('Anggaran')),bg.length?h('button',{type:'button',class:'txt',onclick:()=>{bEdit=!bEdit;bArm=null;renderSum()}},bEdit?tr('Selesai'):tr('Atur')):null));
  if(!bg.length)box.append(h('div',{class:'card p16 bde'},h('p',{class:'mut'},tr('Belum ada anggaran. Buat sendiri, misalnya “Makan di luar” atau “Hiburan”.')),h('button',{type:'button',class:'alt mt',onclick:e=>openBud(null,e.currentTarget)},tr('Tambah anggaran'))));
  else if(bEdit){
    /* mode atur: ketuk − untuk menghapus, seret ≡ untuk mengubah urutan */
    const list=h('div',{class:'card sl'},...bg.map((b,i)=>erow({l:'bud',k:b.id,label:b.name,sub:b.cats.map(cn).join(' · '),armed:bArm===b.id,onMinus:()=>{bArm=bArm===b.id?null:b.id;renderSum()},onDel:()=>delBud(b,i)})));
    sortable(list,(a,z)=>{const c=bdGet(),[x]=c.splice(a,1);c.splice(z,0,x);bdSave(c);renderSum()});
    box.append(list,h('p',{class:'mut foot'},tr('Seret ≡ untuk mengubah urutan. Ketuk − lalu Hapus untuk menghapus anggaran.')));
  }
  else box.append(h('div',{class:'card'},...bg.map(b=>{
    const v=m.reduce((q,t)=>t.type==='out'&&b.cats.includes(t.cat)?q+t.amount:q,0),left=b.amount-v,fill=h('div',{class:'fill'});
    fill.style.transform=`translateX(${Math.min(100,Math.round(v/b.amount*100))-100}%)`;
    return h('button',{type:'button',class:'set bd',onclick:e=>openBud(b,e.currentTarget)},
      h('span',{class:'bw'},h('b',{},b.name),h('small',{},b.cats.map(cn).join(' · ')),
        h('small',{class:left<0?'over':''},LANG==='en'?(left<0?`Over by ${rp(-left)} of ${rp(b.amount)}`:`${rp(left)} left of ${rp(b.amount)}`):(left<0?`Lebih ${rp(-left)} dari ${rp(b.amount)}`:`Sisa ${rp(left)} dari ${rp(b.amount)}`)),
        h('div',{class:'track'},fill)),
      chevR());
  }),h('button',{type:'button',class:'set',onclick:e=>openBud(null,e.currentTarget)},h('span',{class:'ic','aria-hidden':'true'},ico('M12 5v14M5 12h14')),tr('Tambah anggaran'))),h('p',{class:'mut foot'},tr('Dihitung dari pengeluaran di kategori yang dipilih, per bulan.')));
  $('#rs').disabled=!(all.length||bg.length);
  bars.forEach(([f,p],i)=>{f.style.setProperty('--i',i);if(fx)requestAnimationFrame(()=>requestAnimationFrame(()=>f.style.transform=`translateX(${p-100}%)`));else{f.style.transition='none';f.style.transform=`translateX(${p-100}%)`}});
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
function hideToast(){$('#toast').classList.remove('show');undo=null;undoAll=null}

/* Bottom sheet input */
const sheet=$('#sheet');
/* Keyboard tetap terbuka saat mengetuk Keluar/Masuk, kategori, atau memilih tanggal: fokus dikembalikan ke kolom terakhir */
/* Aturan keyboard: terbuka otomatis hanya saat mencatat baru (nominal adalah langkah pertama). Mengganti Keluar/Masuk atau kategori mempertahankan keadaan keyboard apa adanya. Setelah memilih tanggal, kursor pindah ke nominal hanya jika nominal masih kosong. */
let lf=null,kbWas=false;const keep=()=>{if(kbWas)(lf||$('#amt')).focus({preventScroll:true})};
sheet.addEventListener('pointerdown',()=>{const a=document.activeElement;kbWas=!!a&&a.matches('#amt,#note')},true);
sheet.addEventListener('focusin',e=>{if(e.target.matches('#amt,#note'))lf=e.target});
sheet.addEventListener('mousedown',e=>{if(e.target.closest('.seg button,.chip'))e.preventDefault()});
const dateText=v=>{if(!validDate(v))return tr('Pilih tanggal');const d=parse(v),full=d.toLocaleDateString(LOC(),{day:'numeric',month:'short',year:'numeric'});
  return (v===today()?tr('Hari ini'):v===yday()?tr('Kemarin'):d.toLocaleDateString(LOC(),{weekday:'short'}))+', '+full};
function chips(){$('#chips').replaceChildren(...catsFor(f.type,f.cat).map(c=>h('button',{type:'button',class:'chip','data-c':c,onclick:()=>{f.cat=c;paint();keep()}},cn(c))))}
function paint(){
  const a=$('#amt'),bx=$('#amtbox');a.value=f.amt?fmt.format(+f.amt):'';bx.classList.toggle('has',!!f.amt);
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===f.type)));
  $$('#chips .chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c===f.cat)));
  $('.seg').dataset.v=f.type;bx.style.fontSize=Math.min(52,Math.floor(560/Math.max(a.value.length+3,6)))+'px';const rl=$('#ruler');rl.textContent=a.value||'0';a.style.width=rl.offsetWidth+3+'px';$('#dl').textContent=dateText($('#date').value);
  $('#ok').disabled=!f.amt;$('#err').textContent='';
}
function openSheet(t,src){
  ed=t||null;sheet._src=src||$('#add');
  f=t?{type:t.type,amt:String(t.amount),cat:t.cat}:{type:'out',amt:'',cat:CATS.out[0]};
  $('#note').value=t?t.note:'';$('#date').max=today();$('#date').value=t?t.date:today();
  $('#st').textContent=t?tr('Ubah catatan'):tr('Catatan baru');$('#sh-del').hidden=!t;
  lf=null;chips();paint();hideToast();
  if(!t)$('#kb').focus({preventScroll:true});/* buka keyboard di dalam gestur ketuk, lalu pindahkan ke nominal */
  modal(sheet);place();t?sheet.focus({preventScroll:true}):$('#amt').focus({preventScroll:true});settle();
  $('.chip[aria-pressed=true]')?.scrollIntoView({inline:'center',block:'nearest'});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.classList.add('show');if(!t)$('#amt').focus({preventScroll:true});paint()}));
}
function closeSheet(){setOrigin(sheet);sheet.classList.remove('show');setTimeout(()=>{if(!sheet.open)return;sheet.close();const a=document.activeElement,s=sheet._src;/* dialog mengembalikan fokus ke #kb (pembantu keyboard iOS); arahkan ke pemicu */if(s&&s.isConnected&&(!a||a===document.body||a.id==='kb'))s.focus({preventScroll:true})},rm()?0:CLOSE)}
async function save(){
  if(!f.amt)return;
  const t=clean({id:ed?ed.id:newId(),type:f.type,amount:+f.amt,cat:f.cat,note:$('#note').value.trim(),date:$('#date').value});
  if(!t||t.date>today()){$('#err').textContent=t?tr('Tanggal tidak boleh melewati hari ini.'):tr('Tanggalnya belum benar. Pilih tanggal lagi.');return}
  $('#ok').disabled=true;
  try{await dbPut(t)}catch{$('#ok').disabled=false;$('#err').textContent=tr('Gagal menyimpan. Coba lagi.');return}
  const i=all.findIndex(x=>x.id===t.id);i<0?all.push(t):all[i]=t;
  if(!ed)enterId=t.id;
  closeSheet();reveal(t.date.slice(0,7));enterId=null;
}
async function del(){
  const t=ed;closeSheet();
  try{await dbDel(t.id)}catch{toast(tr('Gagal menghapus. Coba lagi.'));return}
  await sleep(CLOSE);
  const el=$$('.tx').find(e=>e.dataset.id===t.id);
  if(el){el.classList.add('leave');await sleep(200)}
  all=all.filter(x=>x.id!==t.id);undo=t;render();
  toast(tr('Catatan dihapus'),tr('Kembalikan'),restore);
}
async function restore(){
  const t=undo;if(!t)return;undo=null;
  try{await dbPut(t)}catch{toast(tr('Gagal mengembalikan catatan. Coba lagi.'));return}
  all.push(t);enterId=t.id;reveal(t.date.slice(0,7));enterId=null;hideToast();
}

/* Anggaran buatan pengguna: {id, name, amount, cats[]}. Disimpan di perangkat (localStorage) dan ikut cadangan. Awalnya kosong. */
const bud=$('#bud');let be=null,bs=new Set(),bBusy=false;
const cleanBud=b=>{
  if(!b||typeof b!=='object')return null;
  const{id,amount,cats}=b,name=typeof b.name==='string'?b.name.trim():'';
  if(typeof id!=='string'||!/^[\w-]{1,40}$/.test(id)||!name||name.length>30)return null;
  if(!Number.isInteger(amount)||amount<1||amount>MAX)return null;
  if(!Array.isArray(cats)||!cats.length||cats.some(c=>typeof c!=='string'||!c.trim()||c.length>CATV))return null;
  return{id,name,amount,cats:[...new Set(cats)]};
};
const bdGet=()=>{let a=[];try{const j=JSON.parse(ls('catat.bud2')||'[]');if(Array.isArray(j))a=j.map(cleanBud).filter(Boolean)}catch{}return a};
const bdSave=a=>ls('catat.bud2',JSON.stringify(a));
/* format lama (satu anggaran per kategori, objek {kategori: nominal}); id tetap supaya impor ulang tidak menggandakan */
const oldBud=o=>{const r=[];if(o&&typeof o==='object')for(const c of [...OLD.out,'Transport']){const v=o[c];if(Number.isInteger(v)&&v>0&&v<=MAX)r.push({id:'old-'+c,name:c,amount:v,cats:[c]})}return r};
function bdMigrate(){
  const o=ls('catat.bud');if(o==null)return;
  try{const old=oldBud(JSON.parse(o)),a=bdGet(),ids=new Set(a.map(x=>x.id));old.forEach(x=>ids.has(x.id)||a.push(x));if(old.length)bdSave(a)}catch{}
  try{localStorage.removeItem('catat.bud')}catch{}
}
function bdValid(){$('#bd-ok').disabled=!($('#bnm').value.trim()&&+$('#bam').value.replace(/\D/g,'')>0&&bs.size)}
/* kategori pengeluaran yang ditawarkan + kategori lama milik anggaran yang sedang diubah */
const bList=()=>[...CATS.out,...(be?be.cats.filter(c=>!CATS.out.includes(c)):[])];
function bdChips(){
  $('#bcats').replaceChildren(...bList().map(c=>{
    const b=h('button',{type:'button',class:'chip','aria-pressed':String(bs.has(c))},cn(c));
    b.onclick=()=>{bs.has(c)?bs.delete(c):bs.add(c);b.setAttribute('aria-pressed',String(bs.has(c)));bdValid()};
    return b;
  }));
}
function openBud(b,src){
  if(bud.open||catd.open||sheet.open||pkd.open||rst.open)return;
  bud._src=src;be=b||null;bs=new Set(b?b.cats:[]);
  $('#bt').textContent=b?tr('Ubah anggaran'):tr('Anggaran baru');
  $('#bnm').value=b?b.name:'';$('#bam').value=b?fmt.format(b.amount):'';$('#bd-del').hidden=!b;$('#berr').textContent='';
  bdChips();bdValid();
  modal(bud);place();b?bud.focus({preventScroll:true}):$('#bnm').focus({preventScroll:true});settle();
  requestAnimationFrame(()=>requestAnimationFrame(()=>bud.classList.add('show')));
}
async function closeBud(then){
  if(!bud.open||bBusy)return;bBusy=true;
  setOrigin(bud);bud.classList.remove('show');await sleep(CLOSE);if(bud.open)bud.close();bBusy=false;then?.();
}
function saveBud(del){
  let a=bdGet();
  if(del){const nm=be.name;a=a.filter(x=>x.id!==be.id);bdSave(a);closeBud(()=>{render();toast(LANG==='en'?`Budget ${nm} deleted.`:`Anggaran ${nm} dihapus.`)});return}
  const name=$('#bnm').value.trim().slice(0,30),nb=cleanBud({id:be?be.id:newId(),name,amount:+$('#bam').value.replace(/\D/g,'').slice(0,10),cats:bList().filter(c=>bs.has(c))});
  if(!nb){$('#berr').textContent=tr('Lengkapi nama, nominal, dan minimal satu kategori.');return}
  const i=a.findIndex(x=>x.id===nb.id);i<0?a.push(nb):a[i]=nb;
  bdSave(a);closeBud(()=>{render();toast(LANG==='en'?`Budget ${name} saved.`:`Anggaran ${name} disimpan.`)});
}

/* Baris yang bisa diatur (kategori & anggaran), gaya Pengaturan iOS: − merah di kiri, nama, ≡ untuk menyeret di kanan.
   Ketuk − → muncul tombol Hapus (− berputar tegak). */
function erow(o){
  const mn=h('button',{type:'button',class:'mn','aria-label':tr('Hapus')+' '+o.label,'aria-expanded':String(!!o.armed),onclick:o.onMinus},ico('M6 12h12'));
  if(o.only)mn.disabled=true;
  return h('div',{class:'er'+(o.armed?' arm':''),'data-l':o.l,'data-k':o.k},mn,
    h('span',{class:'ew'},h('b',{},o.label),o.sub?h('small',{},o.sub):null),
    o.armed?h('button',{type:'button',class:'dl',onclick:o.onDel},tr('Hapus'))
      :h('button',{type:'button',class:'hd','aria-label':LANG==='en'?`Reorder ${o.label}. Drag, or use the up and down arrow keys.`:`Ubah urutan ${o.label}. Seret, atau pakai tombol panah atas dan bawah.`},ico('M5 8h14M5 12h14M5 16h14')));
}
/* Seret untuk mengurutkan: hanya lewat pegangan ≡. Baris yang diseret mengikuti jari, baris lain bergeser memberi tempat.
   Papan ketik: fokus di ≡ lalu panah atas/bawah. commit(dari, ke) menyimpan urutan baru. */
function sortable(box,commit){
  let d=null;
  const clear=()=>{if(!d)return;d.rows.forEach(r=>{r.classList.remove('drag','shift');r.style.transform=''});d=null};
  box.addEventListener('pointerdown',e=>{
    const hd=e.target.closest?.('.hd');if(!hd||d||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
    const rows=[...box.children],row=hd.closest('.er'),i=rows.indexOf(row);if(i<0)return;
    e.preventDefault();
    d={id:e.pointerId,rows,row,i,to:i,y0:e.clientY,rects:rows.map(r=>r.getBoundingClientRect()),busy:false};
    try{hd.setPointerCapture(e.pointerId)}catch{}
    rows.forEach(r=>r!==row&&r.classList.add('shift'));row.classList.add('drag');
    navigator.vibrate?.(6);
  });
  box.addEventListener('pointermove',e=>{
    if(!d||d.busy||e.pointerId!==d.id)return;
    const{rows,rects,i,row}=d,hi=rects[i].height;
    const dy=Math.max(rects[0].top-rects[i].top,Math.min(rects[rows.length-1].top-rects[i].top,e.clientY-d.y0));
    row.style.transform=`translateY(${dy}px) scale(1.02)`;
    const c=rects[i].top+hi/2+dy;let to=0;
    rects.forEach((r,k)=>{if(k!==i&&c>r.top+r.height/2)to++});
    d.to=to;
    rows.forEach((r,k)=>{if(k===i)return;r.style.transform=i<to&&k>i&&k<=to?`translateY(${-hi}px)`:to<i&&k>=to&&k<i?`translateY(${hi}px)`:''});
  });
  const end=e=>{
    if(!d||d.busy||e.pointerId!==d.id)return;
    const{rows,rects,i,to,row}=d,ok=e.type==='pointerup'&&to!==i;
    d.busy=true;
    rows.forEach((r,k)=>{if(k!==i&&!ok)r.style.transform=''});
    row.classList.remove('drag');row.classList.add('shift');
    row.style.transform=ok?`translateY(${to>i?rects[to].bottom-rects[i].height-rects[i].top:rects[to].top-rects[i].top}px)`:'';
    setTimeout(()=>{clear();if(ok)commit(i,to)},rm()?0:200);
  };
  box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
  box.addEventListener('keydown',e=>{
    const hd=e.target.closest?.('.hd'),dir=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
    if(!hd||!dir)return;
    const row=hd.closest('.er'),rows=[...box.children],i=rows.indexOf(row),to=i+dir;
    if(i<0||to<0||to>=rows.length)return;
    e.preventDefault();commit(i,to);
    $$('.er').forEach(r=>{if(r.dataset.l===row.dataset.l&&r.dataset.k===row.dataset.k)r.querySelector('.hd')?.focus({preventScroll:true})});
  });
}
function delBud(b,i){
  bdSave(bdGet().filter(x=>x.id!==b.id));bArm=null;renderSum();
  toast(LANG==='en'?`Budget ${b.name} deleted.`:`Anggaran ${b.name} dihapus.`,tr('Kembalikan'),()=>{
    const c=bdGet();if(!c.some(x=>x.id===b.id)){c.splice(Math.min(i,c.length),0,b);bdSave(c)}
    hideToast();render();
  });
}

/* Kategori buatan pengguna (Ringkasan → Kelola kategori): tambah, hapus, urutkan. Catatan lama tetap memakai nama kategorinya. */
const catd=$('#catd'),CK={out:$('#cl-out'),in:$('#cl-in')};let cArm=null,cBusy=false;
function paintCats(){
  for(const t of['out','in']){
    const l=CATS[t];
    CK[t].replaceChildren(...l.map((c,i)=>{
      const key=t+':'+c;
      return erow({l:t,k:c,label:cn(c),only:l.length<2,armed:cArm===key,
        onMinus:()=>{cArm=cArm===key?null:key;paintCats()},
        onDel:()=>{CATS[t].splice(i,1);cArm=null;catSave();paintCats();place()}});
    }));
  }
}
function updAdd(){for(const t of['out','in'])$('#cb-'+t).disabled=!catName($('#ca-'+t).value)}
function addCat(t){
  const inp=$('#ca-'+t),c=catName(inp.value),err=$('#cerr');
  if(!c)return;
  if(CATS[t].some(y=>catSame(y,c))){err.textContent=LANG==='en'?`Category “${c}” already exists.`:`Kategori “${c}” sudah ada.`;return}
  CATS[t].push(c);catSave();inp.value='';err.textContent='';cArm=null;updAdd();paintCats();place();
  CK[t].lastElementChild?.scrollIntoView({block:'nearest'});
}
function openCat(src){
  if(catd.open||sheet.open||bud.open||pkd.open||rst.open)return;
  catd._src=src;cArm=null;$('#cerr').textContent='';$('#ca-out').value='';$('#ca-in').value='';
  updAdd();paintCats();
  modal(catd);place();catd.focus({preventScroll:true});settle();
  requestAnimationFrame(()=>requestAnimationFrame(()=>catd.classList.add('show')));
}
async function closeCat(){
  if(!catd.open||cBusy)return;cBusy=true;
  setOrigin(catd);catd.classList.remove('show');await sleep(CLOSE);if(catd.open)catd.close();cBusy=false;cArm=null;
}
for(const t of['out','in']){
  sortable(CK[t],(a,z)=>{const[x]=CATS[t].splice(a,1);CATS[t].splice(z,0,x);catSave();paintCats()});
  $('#ca-'+t).addEventListener('input',()=>{$('#cerr').textContent='';updAdd()});
  $('#ca-'+t).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addCat(t)}});
  $('#cb-'+t).addEventListener('pointerdown',e=>e.preventDefault());/* keyboard tetap terbuka */
  $('#cb-'+t).onclick=()=>addCat(t);
}
$('#ct-open').onclick=e=>openCat(e.currentTarget);$('#cat-ok').onclick=()=>closeCat();
catd.addEventListener('click',e=>{if(e.target===catd)closeCat()});
catd.addEventListener('cancel',e=>{e.preventDefault();closeCat()});
catd.addEventListener('close',()=>catd.classList.remove('show'));

/* Reset catatan keuangan: dialog konfirmasi (tombol merah), bisa simpan cadangan dulu; setelah reset ada Kembalikan di snackbar */
const rst=$('#rst');let rBusy=false;
function openRst(src){
  if(rst.open)return;
  const n=all.length,m=bdGet().length,bk=$('#rs-bk');
  $('#rd').textContent=LANG==='en'?`${n} ${n===1?'entry':'entries'}${m?` and ${m} ${m===1?'budget':'budgets'}`:''} will be permanently deleted from this device. Back up first if you still need them.`:`${n} catatan${m?` dan ${m} anggaran`:''} akan dihapus permanen dari perangkat ini. Simpan cadangan dulu kalau masih dibutuhkan.`;
  bk.disabled=false;bk.textContent=tr('Simpan cadangan dulu');
  rst._src=src;modal(rst);setOrigin(rst);
  requestAnimationFrame(()=>requestAnimationFrame(()=>rst.classList.add('show')));
}
async function closeRst(then){
  if(!rst.open||rBusy)return;rBusy=true;
  setOrigin(rst);rst.classList.remove('show');await sleep(CLOSE);if(rst.open)rst.close();rBusy=false;then?.();
}
async function resetAll(){
  const snap={tx:[...all],bud:bdGet()};
  try{await write(s=>s.clear())}catch{closeRst(()=>toast(tr('Gagal mereset. Coba lagi.')));return}
  all=[];bdSave([]);
  closeRst(()=>{$('#q').value='';render();toast(tr('Semua catatan dihapus.'),tr('Kembalikan'),restoreAll);undoAll=snap});
}
async function restoreAll(){
  const s=undoAll;if(!s)return;undoAll=null;
  try{await dbBulk(s.tx)}catch{toast(tr('Gagal mengembalikan. Coba lagi.'));return}
  all=s.tx;bdSave(s.bud);hideToast();render();
}

/* Picker bulan/tahun. Dua tampilan: bulan (per tahun) dan tahun (halaman 12 tahun, mundur sampai MINY).
   Ketuk tahun di judul untuk membuka daftar tahun; panah di kanan = tahun sebelumnya/berikutnya (atau halaman).
   Titik = bulan/tahun yang punya catatan (dari data di memori). */
const pkd=$('#pick'),MSI=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],MSE=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],MINY=1970,PG=12;
let py=0,pv='m',pp=0,pHas=new Set(),pHasY=new Set(),pBusy=false;/* pp = tahun pertama di halaman tahun */
const nowYm=()=>today().slice(0,7);
function pageStart(y){const cy=+nowYm().slice(0,4),k=Math.floor((cy-y)/PG);return cy-PG+1-k*PG}
function paintPick(){
  const cur=nowYm(),cy=+cur.slice(0,4),cm=+cur.slice(5,7),yv=pv==='y';
  const yb=$('#py');yb.setAttribute('aria-expanded',String(yv));yb.setAttribute('aria-label',yv?tr('Kembali ke pilihan bulan'):tr('Pilih tahun'));
  $('#pyt').textContent=yv?`${Math.max(pp,MINY)}–${Math.min(pp+PG-1,cy)}`:py;
  const pr=$('#py-prev'),nx=$('#py-next');
  pr.setAttribute('aria-label',yv?tr('12 tahun sebelumnya'):tr('Tahun sebelumnya'));nx.setAttribute('aria-label',yv?tr('12 tahun berikutnya'):tr('Tahun berikutnya'));
  pr.disabled=yv?pp<=pageStart(MINY):py<=MINY;nx.disabled=yv?pp+PG>cy:py>=cy;
  const g=$('#mg');g.setAttribute('aria-label',yv?tr('Tahun'):tr('Bulan'));
  if(yv){
    g.replaceChildren(...Array.from({length:PG},(_,i)=>{
      const y=pp+i,has=pHasY.has(y),off=y>cy||y<MINY;
      return h('button',{type:'button',class:'mo','aria-pressed':String(y===py),'aria-label':y+(has?tr(', ada catatan'):''),...(has?{'data-d':'1'}:{}),...(off?{disabled:'',class:'mo off'}:{}),onclick:()=>chooseYear(y)},String(y));
    }));
  }else{
    g.replaceChildren(...(LANG==='en'?MSE:MSI).map((s,i)=>{
      const v=`${py}-${pad(i+1)}`,has=pHas.has(v),off=py>cy||(py===cy&&i+1>cm);
      const name=parse(v+'-01').toLocaleDateString(LOC(),{month:'long',year:'numeric'});
      return h('button',{type:'button',class:'mo','aria-pressed':String(v===ym),'aria-label':name+(has?tr(', ada catatan'):''),...(has?{'data-d':'1'}:{}),...(off?{disabled:''}:{}),onclick:()=>choose(v)},s);
    }));
  }
}
function openPick(){
  if(pkd.open||sheet.open)return;
  py=+ym.slice(0,4);pv='m';pp=pageStart(py);
  pHas=new Set(all.map(t=>t.date.slice(0,7)));pHasY=new Set([...pHas].map(v=>+v.slice(0,4)));
  pkd._src=$('#mon');paintPick();modal(pkd);setOrigin(pkd);
  $('.mo[aria-pressed=true]')?.focus({preventScroll:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>pkd.classList.add('show')));
}
/* tutup dengan animasi, kembalikan fokus ke judul bulan, lalu jalankan `then` */
async function closePick(then){
  if(!pkd.open||pBusy)return;pBusy=true;
  setOrigin(pkd);pkd.classList.remove('show');await sleep(CLOSE);
  if(pkd.open)pkd.close();
  pBusy=false;$('#mon').focus({preventScroll:true});then?.();
}
const choose=v=>v===ym?closePick():closePick(()=>jump(v));
const slideGrid=n=>{if(!rm())$('#mg').animate([{opacity:0,transform:`translate3d(${n*16}px,0,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:D2,easing:EZ})};
function stepYear(n){
  const cy=+nowYm().slice(0,4);
  if(pv==='y')pp=Math.max(pageStart(MINY),Math.min(pp+n*PG,pageStart(cy)));else py=Math.max(MINY,Math.min(py+n,cy));
  paintPick();slideGrid(n);
}
function toggleYears(){
  pv=pv==='m'?'y':'m';if(pv==='y')pp=pageStart(py);
  paintPick();slideGrid(pv==='y'?1:-1);
  $('.mo[aria-pressed=true]')?.focus({preventScroll:true});
}
function chooseYear(y){py=y;pv='m';paintPick();slideGrid(-1);$('#py').focus({preventScroll:true})}
/* Esc / Batal: dari daftar tahun kembali ke bulan dulu, baru menutup */
const cancelPick=()=>{if(pv==='y'){toggleYears();return}closePick()};

/* Geser horizontal di daftar: kiri = bulan berikutnya, kanan = sebelumnya. Hanya sentuh/pena; gulir vertikal tidak terganggu. */
const SW_MIN=48,SW_RATIO=1.5,SPR='cubic-bezier(.34,1.45,.5,1)';let noClick=0;
function hold(el){/* di bulan terakhir: daftar bergeser sedikit lalu melenting kembali */
  if(rm())return;
  el.animate([{transform:'translate3d(0,0,0)',easing:EZ},{transform:'translate3d(-14px,0,0)',offset:.3,easing:SPR},{transform:'translate3d(0,0,0)'}],{duration:D});
}
function swipe(el){
  let id=null,x0=0,y0=0;
  el.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||!e.isPrimary||sheet.open||pkd.open||bud.open||catd.open||bEdit||qv()){id=null;return}
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
  const data=JSON.stringify({app:'catat',v:1,exported:new Date().toISOString(),tx:all,bud:bdGet(),cats:{out:CATS.out,in:CATS.in}},null,1);
  const a=h('a',{href:URL.createObjectURL(new Blob([data],{type:'application/json'})),download:`kasku-${today()}.json`});
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true;toast(tr('Cadangan disimpan sebagai berkas .json.'));
}
async function importJSON(file){
  try{
    if(file.size>5e6)throw 0;
    const j=JSON.parse(await file.text());
    if(!j||j.app!=='catat'||j.v!==1||!Array.isArray(j.tx)||j.tx.length>1e5)throw 0;
    const list=j.tx.map(clean);if(list.includes(null))throw 0;
    await dbBulk(list);
    if(j.bud){
      const L=Array.isArray(j.bud)?j.bud.map(cleanBud).filter(Boolean):oldBud(j.bud),cur=bdGet(),ids=new Set(cur.map(x=>x.id));
      L.forEach(x=>ids.has(x.id)||cur.push(x));bdSave(cur);
    }
    if(j.cats&&typeof j.cats==='object'){for(const t of['out','in'])for(const c of catList(j.cats[t]))if(!CATS[t].some(y=>catSame(y,c)))CATS[t].push(c);catSave()}
    const m=new Map(all.map(t=>[t.id,t]));list.forEach(t=>m.set(t.id,t));all=[...m.values()];
    render();toast(LANG==='en'?`${list.length} ${list.length===1?'entry':'entries'} restored.`:`${list.length} catatan dipulihkan.`);
  }catch{toast(tr('Berkas ini bukan cadangan KasKu. Pilih berkas .json dari “Simpan cadangan”.'))}
}

/* Event */
$('#prev').onclick=()=>shift(-1);$('#next').onclick=()=>shift(1);
$$('.tab').forEach(b=>b.onclick=()=>{if(tabNC()||tab===b.dataset.t)return;dx=b.dataset.t==='sum'?1:-1;fx=true;tab=b.dataset.t;render()});
$('#add').onclick=e=>openSheet(null,e.currentTarget);
$('#q').addEventListener('input',()=>render());
$('#bam').addEventListener('input',e=>{const d=e.target.value.replace(/\D/g,'').replace(/^0+/,'').slice(0,10);e.target.value=d?fmt.format(+d):'';bdValid()});
$('#bam').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!$('#bd-ok').disabled)saveBud()}});
$('#bnm').addEventListener('input',bdValid);
$('#bnm').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#bam').focus()}});
$('#bd-ok').onclick=()=>saveBud();$('#bd-del').onclick=()=>saveBud(true);$('#bd-cl').onclick=()=>closeBud();
bud.addEventListener('click',e=>{if(e.target===bud)closeBud()});
bud.addEventListener('cancel',e=>{e.preventDefault();closeBud()});
bud.addEventListener('close',()=>bud.classList.remove('show'));
$('#rs').onclick=e=>openRst(e.currentTarget);$('#rs-cl').onclick=()=>closeRst();$('#rs-ok').onclick=resetAll;
$('#rs-bk').onclick=e=>{exportJSON();e.currentTarget.textContent=tr('Cadangan tersimpan');e.currentTarget.disabled=true};
rst.addEventListener('click',e=>{if(e.target===rst)closeRst()});
rst.addEventListener('cancel',e=>{e.preventDefault();closeRst()});
rst.addEventListener('close',()=>rst.classList.remove('show'));
$('#mon').onclick=openPick;
$('#pk-cl').onclick=cancelPick;$('#py').onclick=toggleYears;
$('#pk-now').onclick=()=>choose(nowYm());
$('#py-prev').onclick=()=>stepYear(-1);
$('#py-next').onclick=e=>{stepYear(1);if(e.currentTarget.disabled)$('#py-prev').focus({preventScroll:true})};
pkd.addEventListener('click',e=>{if(e.target===pkd)closePick()});
pkd.addEventListener('cancel',e=>{e.preventDefault();cancelPick()});
pkd.addEventListener('close',()=>pkd.classList.remove('show'));
swipe($('#list'));swipe($('#cats'));
function setType(t){f.type=t;if(!CATS[t].includes(f.cat))f.cat=CATS[t][0];chips();paint();keep()}
$$('.seg button').forEach(b=>b.onclick=()=>{if(segNC()||f.type===b.dataset.type)return;setType(b.dataset.type)});
/* Nominal: kolom teks biasa + keyboard angka bawaan; diformat Rp saat mengetik */
$('#amt').addEventListener('input',e=>{f.amt=e.target.value.replace(/\D/g,'').replace(/^0+/,'').slice(0,10);paint()});
/* Kunci gulir latar saat jendela terbuka: body dibekukan di posisinya (iOS tidak mengunci gulir di balik <dialog>), dikembalikan saat tutup */
let lockY=0,locks=0;
const lockOn=()=>{if(locks++)return;lockY=scrollY;document.documentElement.classList.add('lock');document.body.style.top=-lockY+'px'};
const lockOff=()=>{if(!locks||--locks)return;document.documentElement.classList.remove('lock');document.body.style.top='';scrollTo(0,lockY)};
const modal=d=>{if(d.open)return;lockOn();d.showModal()};
[sheet,bud,catd,pkd,rst].forEach(d=>d.addEventListener('close',lockOff));
document.addEventListener('touchmove',e=>{
  if(!document.querySelector('dialog[open]'))return;
  const t=e.target,d=t.closest?.('dialog');
  if(t.closest?.('.seg'))return;
  const c=t.closest?.('.chips');if(c&&c.scrollWidth>c.clientWidth+1)return;
  if(d&&d.scrollHeight>d.clientHeight+1)return;
  const cb=t.closest?.('.cbody');if(cb&&cb.scrollHeight>cb.clientHeight+1)return;
  e.preventDefault();
},{passive:false});
/* Jendela melayang: dihitung dari visual viewport supaya selalu duduk di atas keyboard (dan bar bantu iOS) */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const sab=h('div',{class:'sab','aria-hidden':'true'});document.body.append(sab);
/* Morf: jendela tumbuh dari elemen yang membukanya (FAB, baris catatan, judul bulan) dan menyusut kembali ke sana saat ditutup.
   Titik asal dihitung dalam koordinat jendela; jendela berada di tengah horizontal dan top-nya diatur place() (picker: menempel di bawah). */
function setOrigin(d){
  const s=d._src;
  if(!s||!s.isConnected){d.style.removeProperty('--ox');d.style.removeProperty('--oy');return}
  const r=s.getBoundingClientRect(),cw=document.documentElement.clientWidth,ch=document.documentElement.clientHeight,L=(cw-d.offsetWidth)/2;
  let T=parseFloat(d.style.top);
  if(!(T>=0))T=ch-(parseFloat(getComputedStyle(sab).paddingBottom)||0)-12-d.offsetHeight;
  d.style.setProperty('--ox',(r.left+r.width/2-L).toFixed(1)+'px');d.style.setProperty('--oy',(r.top+r.height/2-T).toFixed(1)+'px');
}
let pr=0;
function place(){
  const sheet=[catd,bud,$('#sheet')].find(d=>d.open);if(!sheet)return;
  const v=window.visualViewport||{height:innerHeight,offsetTop:0},kb=Math.max(0,innerHeight-v.height-v.offsetTop),open=kb>80,acc=open&&IOS?56:0;
  const gap=open?10:(parseFloat(getComputedStyle(sab).paddingBottom)||0)+12;
  sheet.style.bottom='auto';
  sheet.style.maxHeight=Math.max(240,v.height-acc-gap-12)+'px';
  sheet.style.top=Math.max(8,v.offsetTop+v.height-acc-gap-sheet.offsetHeight)+'px';setOrigin(sheet);
}
const settle=()=>{cancelAnimationFrame(pr);const t0=performance.now();(function f(){place();if(performance.now()-t0<900)pr=requestAnimationFrame(f)})()};
if(window.visualViewport){visualViewport.addEventListener('resize',place);visualViewport.addEventListener('scroll',place)}
addEventListener('resize',place);
sheet.addEventListener('focusin',settle);sheet.addEventListener('focusout',settle);
new ResizeObserver(place).observe(sheet);new ResizeObserver(place).observe(bud);new ResizeObserver(place).observe(catd);
bud.addEventListener('focusin',settle);bud.addEventListener('focusout',settle);
catd.addEventListener('focusin',settle);catd.addEventListener('focusout',settle);
$('#date').addEventListener('change',()=>{paint();if(!f.amt)setTimeout(()=>$('#amt').focus({preventScroll:true}),80)});
$('#date').addEventListener('click',e=>{if(matchMedia('(pointer:fine)').matches)try{e.target.showPicker()}catch{}});
$('#amtbox').addEventListener('click',()=>$('#amt').focus({preventScroll:true}));
$('#note').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();f.amt?save():$('#amt').focus()}});
$('#amt').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save()}});
$('#ok').onclick=save;$('#sh-del').onclick=del;$('#cl').onclick=closeSheet;
sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
sheet.addEventListener('cancel',e=>{e.preventDefault();closeSheet()});/* Esc: animasi keluar + fokus kembali, seperti dialog lain */
sheet.addEventListener('close',()=>sheet.classList.remove('show'));
$('#ex').onclick=exportJSON;$('#nb').onclick=exportJSON;
$('#im').onclick=()=>$('#file').click();
$('#file').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(fl)importJSON(fl)};
$('#nx').onclick=()=>{ls('catat.bk',today().slice(0,7));$('#nudge').hidden=true};

/* Baris kategori: geser dengan jari atau kursor lewat pointer events (tidak bergantung pada gulir bawaan browser, jadi sama di iOS), dengan momentum ringan */
function dragScroll(el){
  let id=null,x0=0,s0=0,lx=0,lt=0,v=0,mv=false,nc=0,raf=0;
  el.addEventListener('pointerdown',e=>{
    if(el.scrollWidth<=el.clientWidth||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
    cancelAnimationFrame(raf);id=e.pointerId;x0=lx=e.clientX;s0=el.scrollLeft;lt=e.timeStamp;v=0;mv=false;
  });
  el.addEventListener('pointermove',e=>{
    if(e.pointerId!==id)return;
    const dx=e.clientX-x0;
    if(!mv){if(Math.abs(dx)<6)return;mv=true;try{el.setPointerCapture(id)}catch{}}
    const dt=e.timeStamp-lt;if(dt>0)v=.6*v+.4*(lx-e.clientX)/dt;
    lx=e.clientX;lt=e.timeStamp;el.scrollLeft=s0-dx;
  });
  const end=e=>{
    if(e.pointerId!==id)return;id=null;
    if(!mv)return;nc=performance.now()+350;
    if(rm())return;let p=v*16;
    (function f(){el.scrollLeft+=p;p*=.94;if(Math.abs(p)>.3)raf=requestAnimationFrame(f)})();
  };
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('click',e=>{if(performance.now()<nc){e.preventDefault();e.stopPropagation()}},true);
}
dragScroll($('#chips'));
/* Slider kaca (tab bar & Keluar/Masuk & Tampilan): geseran harus dimulai tepat di thumb dan langsung aktif (tanpa menahan): thumb jadi lensa dan mengikuti jari/kursor.
   Sentuhan di luar thumb hanya ketukan (memilih segmen); geseran yang dimulai di luar thumb diabaikan (tidak menggeser slider, tidak memilih segmen, tidak bocor ke elemen lain).
   Saat lensa digeser, gulir halaman dikunci. */
function liquid(root,els,cur,pick,N=2){
  const SLOP=8;
  let x0=0,y0=0,x=0,t0=0,vx=0,b=0,pid=0,down=false,armed=false,drag=false,nc=false,ck=0,tk=0,tv=0,raf=0;
  const rub=k=>k<0?k*.08:k>N-1?N-1+(k-(N-1))*.08:k,sw=()=>(root.clientWidth-8)/N;
  const noClick=()=>{nc=true;setTimeout(()=>nc=false,350)};
  const paint=()=>{root.style.setProperty('--k',Math.max(-.03,Math.min(N-1+.03,ck)).toFixed(4));if(armed)els.forEach((e,i)=>e.style.setProperty('--s',(1+.12*Math.max(0,1-Math.abs(ck-i)*1.1)).toFixed(3)))};
  const done=()=>{root.classList.remove('drive');root.style.removeProperty('--k')};
  function step(){
    if(rm()){ck=tk;tv=0}else{tv=(tv+(tk-ck)*.1)*.68;ck+=tv}
    paint();
    if(Math.abs(tk-ck)>.002||Math.abs(tv)>.002)raf=requestAnimationFrame(step);
    else{raf=0;ck=tk;paint();if(!armed)done()}
  }
  const run=()=>{raf||(raf=requestAnimationFrame(step))};
  function arm(){
    if(!down||armed)return;
    armed=true;drag=false;x0=x;t0=performance.now();vx=0;b=ck=tk=cur();tv=0;
    root.classList.add('lens','drive');paint();
    try{root.setPointerCapture(pid)}catch{}
  }
  root.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    down=true;armed=false;drag=false;pid=e.pointerId;x0=x=e.clientX;y0=e.clientY;
    const c=cur(),r=root.getBoundingClientRect(),s=sw(),l=r.left+4+c*s;
    if(e.clientX<l-2||e.clientX>l+s+2)return;/* di luar thumb: hanya ketukan */
    arm();/* tepat di thumb: langsung bisa digeser */
  });
  root.addEventListener('pointermove',e=>{
    if(!down||e.pointerId!==pid)return;
    if(!armed){
      /* bergerak dari luar thumb = bukan geseran slider: batalkan dan jangan jadikan ketukan */
      if(Math.hypot(e.clientX-x0,e.clientY-y0)>SLOP){down=false;noClick()}
      return;
    }
    if(!drag){if(Math.abs(e.clientX-x0)<4)return;drag=true;x=e.clientX;t0=performance.now();navigator.vibrate?.(6)}
    const now=performance.now();
    if(now>t0)vx=.6*vx+.4*(e.clientX-x)/(now-t0);
    x=e.clientX;t0=now;
    tk=rub(b+(e.clientX-x0)/sw());run();
  });
  /* sedang menggeser: cegah halaman ikut tergulir (gulir vertikal dari thumb tetap milik browser) */
  root.addEventListener('touchmove',e=>{if(armed&&drag&&e.cancelable)e.preventDefault()},{passive:false});
  root.addEventListener('contextmenu',e=>e.preventDefault());
  const end=()=>{
    if(!down)return;down=false;
    if(!armed)return;/* ketukan di luar thumb: biarkan klik memilih segmen */
    armed=false;
    root.classList.remove('lens');els.forEach(e=>e.style.removeProperty('--s'));
    if(!drag){tk=ck=cur();done();return}
    drag=false;noClick();
    const to=Math.max(0,Math.min(N-1,Math.round(tk+vx*120/sw())));
    tk=to;run();
    if(to!==cur())pick(to);
  };
  ['pointerup','pointercancel'].forEach(t=>root.addEventListener(t,end));
  return()=>nc;
}
const tabNC=liquid($('#tabs'),[...$$('.tab')],()=>tab==='sum'?1:0,i=>{dx=i?1:-1;fx=true;tab=i?'sum':'home';render()});
const segNC=liquid($('.seg'),[...$$('.seg button')],()=>f.type==='in'?1:0,i=>setType(i?'in':'out'));
/* Tampilan: Otomatis / Terang / Gelap. Disimpan di perangkat; theme.js menerapkannya sebelum render pertama. */
const THEMES=['auto','light','dark'],tbtn=[...$$('#theme button')];
const curTheme=()=>{const t=ls('catat.theme');return t==='light'||t==='dark'?t:'auto'};
let thT=0;
/* Ubah tampilan (tema / bahasa) semulus mungkin: crossfade seluruh halaman lewat View Transition (satu kurva untuk semua elemen, termasuk gradien kartu).
   Cadangan: transisi warna CSS di semua elemen selama sebentar. Lewati saat render pertama dan saat Reduce Motion. */
function morph(fn,first){
  const r=document.documentElement;
  if(first||rm())fn();
  else if(document.startViewTransition){try{document.startViewTransition(fn)}catch{fn()}}
  else{r.classList.add('themeX');fn();clearTimeout(thT);thT=setTimeout(()=>r.classList.remove('themeX'),520)}
}
function applyTheme(t,save,first){
  const r=document.documentElement;
  morph(()=>{t==='auto'?delete r.dataset.theme:r.dataset.theme=t},first);
  if(save)ls('catat.theme',t);
  document.querySelectorAll('meta[name=theme-color]').forEach((m,i)=>m.content=t==='auto'?(i?'#0E0E0E':'#FAFAFA'):t==='dark'?'#0E0E0E':'#FAFAFA');
  $('#theme').dataset.v=String(THEMES.indexOf(t));
  tbtn.forEach(b=>{const on=b.dataset.theme===t;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1});
}
const setTheme=i=>applyTheme(THEMES[i],true);
const themeNC=liquid($('#theme'),tbtn,()=>THEMES.indexOf(curTheme()),setTheme,3);
tbtn.forEach((b,i)=>{
  b.onclick=()=>{if(themeNC()||curTheme()===THEMES[i])return;setTheme(i)};
  b.onkeydown=e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();const j=(i+d+3)%3;setTheme(j);tbtn[j].focus()};
});
matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',()=>{if(curTheme()==='auto')applyTheme('auto')});
applyTheme(curTheme(),false,true);

/* Bahasa (id/en): teks statis di index.html diterjemahkan lewat kamus EN (teks asli disimpan di node supaya bisa dikembalikan);
   teks dinamis memakai tr()/cn() saat dirender. Isi daftar/anggaran/kategori tidak disentuh (dirender ulang). */
const DYNQ='#list,#cats,#chips,#bcats,#cl-out,#cl-in,#toast,#mg,#monT';
function i18nStatic(){
  const en=LANG==='en',w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let n;n=w.nextNode();){
    const p=n.parentElement;if(!p||p.closest(DYNQ)||p.closest('script,style'))continue;
    if(en){if(n._o!==undefined)continue;const k=n.nodeValue.trim();if(k&&EN[k]!==undefined){n._o=n.nodeValue;n.nodeValue=n.nodeValue.replace(k,EN[k])}}
    else if(n._o!==undefined){n.nodeValue=n._o;delete n._o}
  }
  $$('[aria-label],[placeholder]').forEach(el=>{
    if(el.closest(DYNQ))return;
    for(const a of['aria-label','placeholder']){
      const v=el.getAttribute(a);if(v===null)continue;
      if(en){if(el._oa?.[a]===undefined&&EN[v]!==undefined){(el._oa??={})[a]=v;el.setAttribute(a,EN[v])}}
      else if(el._oa?.[a]!==undefined){el.setAttribute(a,el._oa[a]);delete el._oa[a]}
    }
  });
  document.documentElement.lang=LANG;
  document.title=tr('KasKu: pencatat keuangan pribadi');
  $('meta[name=description]')?.setAttribute('content',tr('Catat pemasukan dan pengeluaran harian dengan cepat. Data hanya tersimpan di perangkatmu.'));
}
const LANGS=['id','en'],lbtn=[...$$('#lang button')];
function applyLang(l,save,first){
  if(save)ls('catat.lang',l);
  $('#lang').dataset.v=String(LANGS.indexOf(l));
  lbtn.forEach(b=>{const on=b.dataset.lang===l;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1});
  if(!first&&l===LANG)return;
  morph(()=>{LANG=l;i18nStatic();if(!first){lastYm=ym;render()}},first);
}
const setLang=i=>applyLang(LANGS[i],true);
const langNC=liquid($('#lang'),lbtn,()=>LANGS.indexOf(LANG),setLang,2);
lbtn.forEach((b,i)=>{
  b.onclick=()=>{if(langNC()||LANG===LANGS[i])return;setLang(i)};
  b.onkeydown=e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();const k=(i+d+2)%2;setLang(k);lbtn[k].focus()};
});
applyLang(LANG,false,true);

/* Mata uang: deretan chip di Ringkasan */
function curText(){$('#amtbox .cur').textContent=CURS[CUR][0];$('#bam').previousElementSibling.textContent=CURS[CUR][0]}
function curChips(){$('#cur').replaceChildren(...Object.keys(CURS).map(c=>{
  const b=h('button',{type:'button',class:'chip','aria-pressed':String(c===CUR),onclick:()=>applyCur(c,true)},c+' · '+CURS[c][0]);
  return b}))}
function applyCur(c,save,first){
  if(save)ls('catat.cur',c);
  if(!first&&c===CUR)return;
  morph(()=>{CUR=c;curText();curChips();if(!first){lastYm=ym;render()}},first);
}
applyCur(CUR,false,true);
/* Kilau kaca mengikuti jari/kursor: dihitung satu kali per frame */
let lq=null;
const litFlush=()=>{const q=lq;lq=null;if(!q)return;const r=q.g.getBoundingClientRect();q.g.style.setProperty('--mx',(q.x-r.left)/r.width*100+'%');q.g.style.setProperty('--my',(q.y-r.top)/r.height*100+'%')};
const lit=e=>{const g=e.target.closest?.('.glass');if(!g)return;if(!lq)requestAnimationFrame(litFlush);lq={g,x:e.clientX,y:e.clientY}};
document.addEventListener('pointerdown',lit,{passive:true});document.addEventListener('pointermove',lit,{passive:true});

/* Mulai */
(async()=>{
  navigator.storage?.persist?.();catLoad();bdMigrate();
  try{db=await openDB();all=(await getAll()).map(clean).filter(Boolean)}catch{toast('Browser ini tidak bisa menyimpan data. Matikan mode privat atau coba browser lain.')}
  render();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
