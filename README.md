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
- Dock berupa kapsul kaca (blur) dengan penanda tab yang bergeser, plus tombol + terpisah di sisi jempol. Ukuran mengikuti Phone/Files iOS 26 (diukur dari screenshot, 402pt): tab bar tinggi 56 dengan thumb 48 (inset 4), tombol + 56 bulat, jarak 8, margin samping 19, jarak ke tepi bawah 19. Kapsul navigasi bulan 88×40 (area sentuh 44), kolom cari tinggi 40.
- Nominal berupa kolom teks dengan keyboard angka bawaan (diformat Rp saat mengetik); font input minimal 16px dan `touch-action:manipulation` agar iOS tidak zoom.
- Masuk = "+" tebal, keluar = "−" biasa. Edit/hapus lewat tap baris; hapus bisa Urungkan.
- Mengikuti panduan Apple "Adopting Liquid Glass": kaca hanya untuk lapisan fungsional di atas konten (dock, tombol +, navigasi bulan, snackbar, sheet). Kartu dan daftar flat. Jangan menumpuk kaca di atas kaca.
- Slider/segmented: lintasan flat (`--fill`), thumb putih (terang) / abu (gelap); saat disentuh thumb berubah jadi lensa kaca bening yang membesar, lintasannya diam. Tanpa warna pelangi, tanpa rim yang dihitung dari latar.
- Sheet/picker/anggaran: tumbuh dari elemen yang membukanya (FAB, baris, judul bulan) dan menyusut kembali ke sana (`setOrigin`). Radius sheet 36 = padding 20 + radius isi 16 (konsentris).
- Konten yang bergulir di bawah dock memakai scroll edge effect (blur progresif + pudar), bukan gradasi pekat.
- Aksesibilitas: `prefers-reduced-transparency` (kaca jadi buram), `prefers-contrast: more` (teks, garis, dan rim lebih tegas), `prefers-reduced-motion` (tanpa gerak).
- Latar dikunci saat jendela terbuka (`html.lock`).
- Impor menggabungkan data dan menolak skema salah. Tanpa innerHTML/inline script; animasi hanya transform/opacity, tanpa animasi yang berjalan terus-menerus, dan mati saat reduced-motion.
- Skala UI mengikuti iOS: radius kapsul untuk kontrol, 24 untuk kartu, 28 untuk hero, 36 untuk sheet; body 17, tinggi sentuh minimal 44; dock duduk dekat home indicator. Keyboard tidak menutup saat berpindah Keluar/Masuk, kategori, atau tanggal.
- Judul bulan adalah tombol (▾) yang membuka picker bulan/tahun: dialog kaca kecil dengan animasi sama seperti sheet; bulan setelah bulan ini nonaktif, titik menandai bulan yang punya catatan (dihitung dari data di memori). Memilih bulan memanggil `jump()` setelah dialog menutup, fokus kembali ke judul.
- Geser horizontal di daftar (Beranda) dan rincian (Ringkasan) pindah bulan lewat `jump()`: butuh |dx| ≥ 48px dan |dx| > 1,5×|dy|, hanya sentuh/pena, mati saat sheet/picker terbuka. Di bulan terakhir, geser kiri hanya memberi efek tahan ringan. Kartu saldo tidak ikut.
- Form catatan adalah jendela kaca melayang; posisinya dihitung dari visual viewport sehingga selalu di atas keyboard (plus ruang untuk bar bantu iOS).
- Radius: kapsul untuk kontrol (termasuk kolom cari dan stepper tahun), 16 untuk elemen di dalam kartu/sheet (`--r-sm`), 24 untuk kartu (`--r-md`), 28 untuk hero (`--r-lg`), 36 untuk sheet (`--r-sheet`). Merah (`--red`) hanya untuk aksi hapus, pesan galat, dan anggaran terlampaui.
- Teks terkecil 11px (label tab), teks sekunder minimal 14px. Istilah: "catatan" = satu transaksi, "keterangan" = isi kolom teks opsional.
