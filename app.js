'use strict';
const $ = s => document.querySelector(s), D = document;
const nf = new Intl.NumberFormat('id-ID');
const fmt = n => (n < 0 ? '−' : '') + 'Rp ' + nf.format(Math.abs(n));
const pad = n => String(n).padStart(2, '0');
const ymOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
const today = () => { const d = new Date(); return ymOf(d) + '-' + pad(d.getDate()); };
const pd = s => { const [a, b, c] = s.split('-'); return new Date(+a, +b - 1, +c); };
// Semua teks dipasang lewat textContent (bukan innerHTML) agar aman dari XSS.
const el = (t, c, x) => { const e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const CATS = { out: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Lainnya'], in: ['Gaji', 'Bonus', 'Lainnya'] };
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
let db, all = [], ym = ymOf(new Date()), cur = {}, newId = null, tt;

// ---- Penyimpanan (IndexedDB) ----
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('saku', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('tx', { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const run = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('tx', mode), r = fn(t.objectStore('tx'));
  t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
});
const ok = t => t && typeof t === 'object' && (t.type === 'in' || t.type === 'out') && Number.isInteger(t.amt) && t.amt > 0 && t.amt <= 1e12
  && typeof t.id === 'string' && t.id.length <= 40 && typeof t.cat === 'string' && t.cat.length <= 30
  && typeof t.note === 'string' && t.note.length <= 100 && /^\d{4}-\d{2}-\d{2}$/.test(t.date);

// ---- Tampilan ----
// Angka saldo berhitung halus: menunjukkan dampak transaksi pada sisa uang.
function countTo(e, to) {
  const from = e._v ?? 0; e._v = to;
  if (calm || from === to) { e.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function f(t) {
    const p = Math.min(1, (t - t0) / 400), k = 1 - Math.pow(1 - p, 3);
    e.textContent = fmt(Math.round(from + (to - from) * k));
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}
function dayLabel(s) {
  if (s === today()) return 'Hari ini';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === ymOf(y) + '-' + pad(y.getDate())) return 'Kemarin';
  return pd(s).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}
function render() {
  const list = all.filter(t => t.date.startsWith(ym)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  let i = 0, o = 0; const bc = {}, dayOut = {};
  for (const t of list) {
    if (t.type === 'in') i += t.amt;
    else { o += t.amt; bc[t.cat] = (bc[t.cat] || 0) + t.amt; dayOut[t.date] = (dayOut[t.date] || 0) + t.amt; }
  }
  const [y, m] = ym.split('-');
  $('#mon').textContent = new Date(+y, +m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  $('#next').disabled = ym >= ymOf(new Date());
  countTo($('#bal'), i - o); $('#in').textContent = fmt(i); $('#out').textContent = fmt(o);

  const cats = $('#cats'); cats.replaceChildren();
  Object.entries(bc).sort((a, b) => b[1] - a[1]).forEach(([c, v]) => {
    const li = el('li'), r = el('div', 'row'), tr = el('div', 'trk'), f = el('i');
    r.append(el('span', 0, c), el('span', 't2', fmt(v))); tr.append(f); li.append(r, tr); cats.append(li);
    f.style.transform = 'scaleX(0)';
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transform = 'scaleX(' + v / o + ')'; }));
  });

  const L = $('#list'); L.replaceChildren();
  if (!list.length) {
    const e = el('div', 'empty'); e.append(el('p', 0, 'Belum ada catatan bulan ini.'), el('p', 't2', 'Tap Catat untuk mulai.')); L.append(e);
  }
  let last = '';
  for (const t of list) {
    if (t.date !== last) {
      last = t.date; const h = el('div', 'day');
      h.append(el('span', 0, dayLabel(t.date)), el('span', 0, dayOut[t.date] ? 'Keluar ' + fmt(dayOut[t.date]) : ''));
      L.append(h);
    }
    const b = el('button', 'item' + (t.id === newId ? ' new' : '')), l = el('span');
    l.append(el('span', 0, t.cat)); if (t.note) l.append(el('small', 0, t.note));
    b.append(l, el('span', t.type === 'in' ? 'in' : '', (t.type === 'in' ? '+' : '−') + fmt(t.amt)));
    b.onclick = () => openSheet(t); L.append(b);
  }
  newId = null;
  const ex = +ls.get('saku_exp') || +ls.get('saku_base') || 0;
  $('#nudge').hidden = !(all.length && ex && Date.now() - ex > 2592e6);
}

// ---- Form catat ----
function setType(ty) {
  cur.type = ty; if (!CATS[ty].includes(cur.cat)) cur.cat = CATS[ty][0];
  $('#s-out').setAttribute('aria-selected', ty === 'out'); $('#s-in').setAttribute('aria-selected', ty === 'in');
  const c = $('#chips'); c.replaceChildren();
  CATS[ty].forEach(n => {
    const b = el('button', 'chip', n); b.type = 'button'; b.setAttribute('aria-pressed', n === cur.cat);
    b.onclick = () => { cur.cat = n; c.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); };
    c.append(b);
  });
}
function openSheet(t) {
  cur = t ? { ...t } : { type: 'out', cat: 'Makan', id: null };
  setType(cur.type);
  $('#amt').value = t ? nf.format(t.amt) : ''; $('#note').value = t ? t.note : '';
  $('#date').max = today(); $('#date').value = t ? t.date : today();
  $('#err').textContent = ''; $('#del').hidden = !t;
  $('#sheet').showModal(); $('#amt').focus();
}
function toast(m, a, fn) {
  const T = $('#toast'), b = $('#ta'); $('#tm').textContent = m; b.hidden = !a; b.textContent = a || '';
  b.onclick = () => { clearTimeout(tt); T.hidden = true; fn && fn(); };
  T.hidden = false; clearTimeout(tt); tt = setTimeout(() => { T.hidden = true; }, 5000);
}

$('#amt').oninput = e => {
  const v = e.target.value.replace(/\D/g, '').slice(0, 12);
  e.target.value = v ? nf.format(+v) : ''; $('#err').textContent = '';
};
$('#s-out').onclick = () => setType('out'); $('#s-in').onclick = () => setType('in');
$('#add').onclick = () => openSheet();
$('#save').onclick = async () => {
  const amt = parseInt($('#amt').value.replace(/\D/g, ''), 10) || 0;
  if (!amt) { $('#err').textContent = 'Isi nominal dulu.'; $('#amt').focus(); return; }
  const d = $('#date').value;
  const t = {
    id: cur.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: cur.type, amt, cat: cur.cat, note: $('#note').value.trim().slice(0, 100),
    date: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today()
  };
  try { await run('readwrite', s => s.put(t)); }
  catch { $('#err').textContent = 'Gagal menyimpan. Coba lagi.'; return; }
  all = all.filter(x => x.id !== t.id); all.push(t);
  ym = t.date.slice(0, 7); newId = cur.id ? null : t.id;
  if (!ls.get('saku_base')) ls.set('saku_base', Date.now());
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  $('#sheet').close(); render();
};
$('#del').onclick = async () => {
  const t = all.find(x => x.id === cur.id); if (!t) return;
  await run('readwrite', s => s.delete(t.id)); all = all.filter(x => x !== t);
  $('#sheet').close(); render();
  toast('Catatan dihapus', 'Urungkan', async () => { await run('readwrite', s => s.put(t)); all.push(t); render(); });
};

// ---- Navigasi bulan ----
const shift = n => { const [y, m] = ym.split('-'); ym = ymOf(new Date(+y, +m - 1 + n, 1)); render(); };
$('#prev').onclick = () => shift(-1); $('#next').onclick = () => shift(1);

// ---- Cadangan ----
$('#bk').onclick = $('#nb').onclick = () => $('#bkd').showModal();
$('#exp').onclick = () => {
  const u = URL.createObjectURL(new Blob([JSON.stringify({ app: 'saku', v: 1, tx: all })], { type: 'application/json' }));
  const a = el('a'); a.href = u; a.download = 'saku-' + today() + '.json';
  D.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  ls.set('saku_exp', Date.now()); $('#bkd').close(); toast('Cadangan tersimpan'); render();
};
$('#imb').onclick = () => $('#imp').click();
$('#imp').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    if (f.size > 5e6) throw 0;
    const j = JSON.parse(await f.text()), a = Array.isArray(j) ? j : j.tx;
    if (!Array.isArray(a) || !a.length || !a.every(ok)) throw 0;
    const c = a.map(t => ({ id: t.id, type: t.type, amt: t.amt, cat: t.cat, note: t.note, date: t.date }));
    await run('readwrite', s => c.forEach(t => s.put(t)));
    const m = new Map(all.map(t => [t.id, t])); c.forEach(t => m.set(t.id, t)); all = [...m.values()];
    $('#bkd').close(); render(); toast(c.length + ' catatan dipulihkan');
  } catch { toast('File tidak valid. Pilih file cadangan Saku (.json).'); }
};

// Tap di luar sheet menutupnya.
D.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => {
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));

(async () => {
  try { db = await open(); all = (await run('readonly', s => s.getAll())).filter(ok); }
  catch { toast('Penyimpanan browser tidak tersedia. Jangan gunakan mode penyamaran.'); }
  render();
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
