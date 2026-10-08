# KasKu
Pencatat keuangan pribadi. Situs statis tanpa backend dan tanpa login. Data tersimpan di perangkat (IndexedDB + localStorage). Rupiah saja, Indonesia/English.

## Struktur
```
render.yaml       Blueprint Render + header keamanan
public/           folder yang dipublikasikan
  index.html  sw.js  manifest.webmanifest  _headers
  assets/  app.js  style.css  theme.js  lg.js  icon.*
```

## Deploy (Render)
1. Dorong repo ke GitHub/GitLab, lalu New → Static Site.
2. Build Command kosong, Publish Directory `public`.
3. Header keamanan: Render tidak membaca `_headers` (itu untuk Netlify/Cloudflare Pages). Pakai New → Blueprint (`render.yaml`) atau salin header ke Dashboard. Isi kedua file harus selalu sama.
4. Setiap rilis: naikkan `V` di `sw.js` dan `?v=` di `index.html`. File baru juga masuk daftar `A` di `sw.js`.

## Fitur
- Catatan masuk/keluar, kategori buatan sendiri (seret untuk urut), anggaran per kategori, pencarian, ringkasan bulanan.
- Pindah bulan: ketuk judul bulan (picker) atau geser daftar. Kartu saldo diam, angkanya berhitung.
- Edit/hapus lewat tap baris, hapus bisa Urungkan. Reset, cadangan, dan pulihkan (impor menggabungkan dan menolak skema salah).
- Tema Otomatis/Terang/Gelap dan bahasa ID/EN, dengan crossfade View Transition.

## Keputusan desain
- **Gaya:** iOS. Kaca (Liquid Glass) hanya untuk lapisan fungsional di atas konten: dock, tombol +, kapsul bulan, snackbar, sheet. Kartu dan daftar flat, jangan menumpuk kaca di atas kaca.
- **Skala:** radius kapsul untuk kontrol, 16 elemen dalam kartu, 24 kartu, 28 hero, 36 sheet. Body 17px, sentuh minimal 44, teks terkecil 11px.
- **Slider** (tab bar, Keluar/Masuk, Tampilan): thumb jadi lensa kaca saat disentuh, fisika tiga pegas di `liquid()` (`app.js`), refraksi di `lg.js` (hanya Chromium; Safari/iOS tanpa refraksi karena `backdrop-filter:url()` belum didukung).
- **Sheet/picker/dialog:** tumbuh dari elemen pembukanya dan menyusut kembali (`setOrigin`). Form melayang di atas keyboard (posisi dari visual viewport).
- **Warna:** monokrom. Merah hanya untuk hapus, galat, dan anggaran terlampaui.
- **Angka besar** selalu satu baris (font dikecilkan sampai muat).
- **Istilah:** "catatan" = satu transaksi, "keterangan" = teks opsional.

## Gerak
- Durasi: `--d1 .15s` (tekan), `--d2 .25s` (pudar), `--d3 .5s` (pindah). `D`/`D2` di `app.js` harus sama dengan `--d3`/`--d2`.
- Kurva: masuk `--ease` / `--spring`, keluar `--ease-in` dengan `--d-out` (.26s). `CLOSE` di `app.js` harus sama dengan `--d-out`.
- Ikon tombol: tekan cepat (`--d1`), lepas memantul (`--spring`), seperti matahari/bulan. Aturannya ada di akhir `style.css` (blok v78).
- Hanya `transform`/`opacity`, tanpa animasi yang berjalan terus-menerus. Mati total saat reduced-motion.

## Aksesibilitas & keamanan
- Mendukung `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast: more`. Cincin fokus hanya muncul saat memakai keyboard.
- CSP ketat (`connect-src 'self'`, `img-src 'self' data:`), tanpa `innerHTML` dan inline script, tanpa permintaan jaringan dari aplikasi.

## Bahasa
String baru ditulis dalam Indonesia, lalu tambahkan padanannya di kamus `EN` (`app.js`). Teks dinamis memakai `tr()`. Kategori bawaan disimpan dengan nama Indonesia dan ditampilkan lewat `cn()`.

## Riwayat versi
| Versi | Perubahan |
|---|---|
| v78 | Ikon tombol ikut bergerak: gear berputar saat membuka/menutup Pengaturan, X berputar, ikon baris menyusut, panah cadangan turun/naik, chevron bergeser |
| v79 | Header, toast, dan dock disesuaikan dengan outline desain: tombol tema/pengaturan 42px, pil bulan 157x42, inset 21px; tab bar dan tombol + 58px, toast 48px. Aturannya di blok v79 akhir `style.css`. |
| v77 | Gerak seragam: kurva keluar sendiri, dialog tidak terpotong saat menutup, pindah tab memudar keluar (`tabOut()`), versi cache disamakan |
| v73 | Hanya Rupiah, tanpa jaringan. Cara pakai dan Syarat & ketentuan (dialog `#inf`, isi di `INFO`). `sw.js` ditulis ulang |
| v56 | Rapikan halaman: angka muat satu baris, nama kategori dipotong titik-titik, area sentuh 44, `theme-color` ikut tema |
| v55 | Slider terasa iOS 26: tiga pegas, regang searah geser, bezel lensa Snell (n=1,5) |
| v47 | Fix thumb tab bar saat Pengaturan → Ringkasan. Tombol tema dua kondisi. Menu kaca buatan sendiri. Fokus hanya untuk keyboard |
| v46 | Panah bulan diganti picker bulan/tahun. Tombol tema di kiri atas. Transisi Pengaturan ⇄ Ringkasan dirapikan |
| v45 | Kapsul bulan dua baris. Header dan Simpan form tetap, hanya isi yang bergulir |
| v44 | Lensa slider `.lz` di atas ikon dan label, dengan perbesaran inti dan chroma |
| v36 | Header meniru Files: tombol Pengaturan bulat di kanan |
| v35 | Pengaturan pindah ke pojok kiri atas, tab bar tinggal Beranda & Ringkasan. Kategori di sheet satu baris geser |
| v34 | Format uang via `Intl.NumberFormat`. Tombol Simpan abu saat nonaktif dan menempel di bawah sheet |

Dibuat oleh Joel G. Thompson.
