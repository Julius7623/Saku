# Catat
Pencatat keuangan pribadi. Static site, tanpa backend, tanpa login. Data tersimpan di IndexedDB perangkat.

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
4. Header keamanan: Render tidak membaca `_headers`. Pakai New → Blueprint (membaca `render.yaml`), atau salin header ke Dashboard → Headers. `_headers` tetap disertakan untuk Netlify/Cloudflare Pages.
5. Menambah file baru? Masukkan ke daftar `A` di `sw.js` dan naikkan `V`.

## Keputusan desain
- Gaya iOS: judul bulan besar, daftar terkelompok dengan monogram kategori, font sistem (SF di perangkat Apple).
- Kartu saldo bergradasi abu (hitam di tema terang, putih di gelap) dengan kilau halus; hanya warna token.
- Dock berupa kapsul kaca (blur) dengan penanda tab yang bergeser, plus tombol + terpisah di sisi jempol.
- Nominal berupa kolom teks dengan keyboard angka bawaan (diformat Rp saat mengetik); font input minimal 16px dan `touch-action:manipulation` agar iOS tidak zoom.
- Masuk = "+" tebal, keluar = "−" biasa. Edit/hapus lewat tap baris; hapus bisa Urungkan.
- Liquid glass hanya untuk kontrol yang melayang di atas konten (dock, tombol +, navigasi bulan, snackbar, thumb slider); kartu, daftar, dan sheet tetap flat. Thumb slider melar saat digeser, kilau mengikuti jari.
- Impor menggabungkan data dan menolak skema salah. Tanpa innerHTML/inline script; animasi hanya transform/opacity dan mati saat reduced-motion.
- Skala UI mengikuti iOS: radius kapsul untuk kontrol, 20 untuk kartu, 28 untuk hero dan sheet; body 17, tinggi sentuh minimal 44; dock duduk dekat home indicator. Keyboard tidak menutup saat berpindah Keluar/Masuk, kategori, atau tanggal.
