# Catat
Pencatat keuangan pribadi. Situs statis tanpa backend dan tanpa login. Data tersimpan di IndexedDB perangkat.

## Struktur
```
render.yaml            Blueprint Render + header keamanan
public/                folder yang dipublikasikan
  index.html  sw.js  manifest.webmanifest  _headers
  assets/  app.js  style.css  icon.svg
```

## Deploy ke Render
1. Push folder ini ke GitHub/GitLab.
2. Render → New → Static Site → pilih repo.
3. **Build Command:** kosong (atau `echo "no build"`)
   **Publish Directory:** `public`
4. Header keamanan: Render tidak membaca `_headers`. Pakai New → Blueprint (membaca `render.yaml`), atau salin header ke Dashboard → Headers. `_headers` dipakai Netlify/Cloudflare Pages. Isi kedua file harus selalu sama.
5. Menambah atau mengubah file? Naikkan `V` di `sw.js` (file baru juga masuk daftar `A`).

## Keputusan desain
- Gaya iOS: judul bulan besar, daftar terkelompok dengan monogram kategori, font sistem (SF di perangkat Apple).
- Kartu saldo bergradasi abu (hitam di tema terang, putih di gelap) dengan kilau halus; hanya warna token. Kartu ini diam saat pindah bulan, hanya angkanya yang berhitung naik/turun.
- Pindah bulan: judul bulan bergeser, daftar di bawah kartu ikut bergeser, kartu saldo tetap. Gerak memakai 3 durasi (`--d1/--d2/--d3`) dan 2 kurva (`--ease`, `--spring`); `D` di `app.js` harus sama dengan `--d3`.
- Dock berupa kapsul kaca (blur) dengan penanda tab yang bergeser, plus tombol + terpisah di sisi jempol.
- Nominal berupa kolom teks dengan keyboard angka bawaan (diformat Rp saat mengetik); font input minimal 16px dan `touch-action:manipulation` agar iOS tidak zoom.
- Masuk = "+" tebal, keluar = "−" biasa. Edit/hapus lewat tap baris; hapus bisa Urungkan.
- Liquid glass hanya untuk kontrol yang melayang di atas konten (dock, tombol +, navigasi bulan, snackbar, thumb slider); kartu, daftar, dan sheet tetap flat. Thumb slider melar saat digeser, kilau mengikuti jari.
- Impor menggabungkan data dan menolak skema salah. Tanpa innerHTML/inline script; animasi hanya transform/opacity, tanpa animasi yang berjalan terus-menerus, dan mati saat reduced-motion.
- Skala UI mengikuti iOS: radius kapsul untuk kontrol, 20 untuk kartu, 28 untuk hero dan sheet; body 17, tinggi sentuh minimal 44; dock duduk dekat home indicator. Keyboard tidak menutup saat berpindah Keluar/Masuk, kategori, atau tanggal.
- Form catatan adalah jendela kaca melayang; posisinya dihitung dari visual viewport sehingga selalu di atas keyboard (plus ruang untuk bar bantu iOS).
