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
- Kartu saldo dibalik (hitam di tema terang, putih di gelap) + bayangan lembut: ada titik fokus, tetap hanya warna token.
- Masuk = "+" tebal, keluar = "−" biasa; tanpa warna.
- Kategori awal sudah terpilih: catat cukup + → nominal → Simpan.
- Edit/hapus lewat tap baris (tanpa geser, agar tidak salah hapus); hapus bisa Urungkan 6 detik.
- Impor menggabungkan data (tidak menimpa) dan menolak file dengan skema salah.
- Tanpa innerHTML, tanpa inline script/style, CSP `default-src 'self'`.
- Animasi hanya transform/opacity, mati saat `prefers-reduced-motion`.
