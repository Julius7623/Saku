# KasKu
Pencatat keuangan pribadi. Situs statis tanpa backend dan tanpa login. Data tersimpan di IndexedDB perangkat.

## Struktur
```
render.yaml            Blueprint Render + header keamanan
public/                folder yang dipublikasikan
  index.html  sw.js  manifest.webmanifest  _headers
  assets/  app.js  style.css  theme.js  lg.js  icon.svg  icon-*.png
```

## Deploy ke Render
1. Dorong folder ini ke GitHub/GitLab.
2. Render → New → Static Site → pilih repo.
3. **Build Command:** kosong (atau `echo "no build"`)
   **Publish Directory:** `public`
4. Header keamanan: Render tidak membaca `_headers`. Pakai New → Blueprint (membaca `render.yaml`), atau salin header ke Dashboard → Headers. `_headers` dipakai Netlify/Cloudflare Pages. Isi kedua file harus selalu sama.
5. Menambah atau mengubah file? Naikkan `V` di `sw.js` (file baru juga masuk daftar `A`).

## Keputusan desain
- Gaya iOS: judul bulan besar, daftar terkelompok dengan monogram kategori, font sistem (SF di perangkat Apple).
- Kartu saldo bergradasi abu gelap di kedua tema (tema gelap sengaja diredupkan agar tidak jadi satu-satunya elemen terang) dengan kilau halus; hanya warna token. Kartu ini diam saat pindah bulan, hanya angkanya yang berhitung naik/turun.
- Pindah bulan: judul bulan bergeser, daftar di bawah kartu ikut bergeser, kartu saldo tetap. Gerak memakai 3 durasi (`--d1/--d2/--d3`) dan 2 kurva (`--ease`, `--spring`); `D` di `app.js` harus sama dengan `--d3`.
- Dock berupa kapsul kaca (blur) dengan penanda tab yang bergeser, plus tombol + terpisah di sisi jempol. Tombol + memakai kaca bening yang sama dengan tab bar (tanpa isi warna). Ukuran mengikuti Phone/Files iOS 26 (diukur dari screenshot, 402pt): tab bar tinggi 56 dengan thumb 48 (inset 4), tombol + 56 bulat, jarak 8, margin samping 16, sejajar dengan konten, jarak ke tepi bawah 19. Kapsul navigasi bulan 88×40 (area sentuh 44), kolom cari tinggi 40.
- Nominal berupa kolom teks dengan keyboard angka bawaan (diformat Rp saat mengetik); font input minimal 16px dan `touch-action:manipulation` agar iOS tidak zoom.
- Masuk = "+" tebal, keluar = "−" biasa. Edit/hapus lewat tap baris; hapus bisa Urungkan.
- Kaca light mode mengikuti iOS (Phone/Files): isi hampir putih, cincin abu tipis + highlight putih di dalamnya, tepi dalam sedikit gelap, bayangan sangat halus, pil aktif abu lembut (~#EBEBEB). Token di blok :root pertama style.css.
- Mengikuti panduan Apple "Adopting Liquid Glass": kaca hanya untuk lapisan fungsional di atas konten (dock, tombol +, navigasi bulan, snackbar, sheet). Kartu dan daftar flat. Jangan menumpuk kaca di atas kaca.
- Slider (tab bar, Keluar/Masuk, Tampilan): tanpa perlu menahan. Geseran harus dimulai tepat di thumb; begitu disentuh thumb jadi lensa dan mengikuti jari/kursor (gulir halaman terkunci selama digeser). Geseran yang dimulai di luar thumb diabaikan; ketukan di luar thumb tetap memilih segmen.
- Anggaran buatan pengguna, awalnya kosong: `{id, name, amount, cats[]}` di `localStorage` kunci `catat.bud2`. Nama bebas (maks 30), nominal per bulan, dan satu atau lebih kategori pengeluaran yang dihitung. Anggaran lama (satu per kategori, kunci `catat.bud`) dipindah sekali ke format baru. Cadangan menyimpan daftar anggaran; cadangan lama tetap bisa dipulihkan.
- Kategori buatan pengguna (Ringkasan → Kelola kategori): daftar pengeluaran dan pemasukan terpisah, awalnya berisi kategori bawaan. Tambah lewat kolom input, hapus lewat − merah lalu Hapus (minimal satu kategori tersisa per jenis), urutkan dengan menyeret ≡ (papan ketik: fokus di ≡ lalu panah atas/bawah). Disimpan di `localStorage` kunci `catat.cats` dan ikut cadangan (impor menggabungkan). Menghapus kategori tidak mengubah catatan lama: nama kategorinya tetap tampil.
- Anggaran bisa diatur: tombol Atur di judul Anggaran membuka mode atur (− untuk hapus dengan Kembalikan di snackbar, ≡ untuk mengurutkan). Urutan tersimpan di `catat.bud2`.
- Reset catatan keuangan (Ringkasan, paling bawah): dialog konfirmasi dengan tombol merah, fokus awal di Batal, bisa Simpan cadangan dulu. Menghapus semua catatan dan anggaran (tampilan tidak ikut). Setelah itu ada Kembalikan di snackbar selama beberapa detik.
- Slider Tampilan memakai desain yang sama dengan tab bar Beranda (kapsul kaca 56px, pil translusen, ikon di atas label, lensa saat disentuh), tanpa kartu pembungkus.
- Dialog Kategori: header (judul + Selesai) tetap, hanya isi yang bergulir dengan pudar halus di tepi; cincin fokus dialog dimatikan.
- Slider/segmented: lintasan flat (`--fill`), thumb putih (terang) / abu (gelap); saat disentuh thumb berubah jadi lensa kaca bening yang membesar, lintasannya diam. Fringe kromatik di rim lensa (`CHROMA` di `lg.js`, isi 0 untuk mematikan) dan kilau tepi yang dihitung dari latar: kanal B peta menyimpan topeng kilau (cahaya dari kiri-atas), dikalikan warna latar yang sudah dibiaskan lalu dicerahkan, jadi tepi lensa memantulkan isi di belakangnya.
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
- v55 · slider terasa seperti iOS 26. `liquid()` di `app.js` memakai tiga pegas berbasis waktu (bukan per frame): posisi (memantul saat dilepas), tekan (`--pr`, overshoot = pop saat disentuh), dan regang searah geser (`--st` besar, `--sv` arah; tepi belakang lensa tetap, tepi depan memanjang, lalu bergoyang saat berhenti). Bezel lensa di `lg.js` mengikuti pembiasan Snell (n=1,5), jadi makin ke tepi makin membelok. Safari/iOS belum mendukung `url()` di `backdrop-filter`: di sana hanya fisika pegas dan rim CSS yang jalan, tanpa refraksi. Peta displacement memakai gambar `data:`, jadi CSP butuh `img-src 'self' data:` (`_headers` dan `render.yaml` harus sama).
- v56 · rapikan semua halaman. Angka besar (saldo, pemasukan, pengeluaran) selalu satu baris: `app.js` mengecilkan font sampai muat, dan di layar sempit kotak pemasukan/pengeluaran ditumpuk bila masih tidak muat (batas nominal 10 digit tetap aman di 320px). Nama kategori di daftar dipotong titik-titik, tidak lagi menabrak nominal. Slider jenis di sheet muat di layar 320. Area sentuh Edit dan Tambah 44. Placeholder kolom cari memakai titik-titik. Ada `theme-color` yang mengikuti tema (juga saat tema diubah manual).

## Bahasa (ID/EN)
- Pemilih bahasa ada di Ringkasan → Bahasa. Disimpan di `localStorage` kunci `catat.lang`; bawaannya mengikuti bahasa perangkat.
- Teks statis `index.html` diterjemahkan lewat kamus `EN` di `assets/app.js` (teks asli dikembalikan saat kembali ke Indonesia). Teks dinamis memakai `tr()`. Tambah string baru: tulis dalam bahasa Indonesia, lalu tambahkan padanannya di `EN`.
- Kategori bawaan disimpan dengan nama Indonesia (kunci tetap) dan ditampilkan lewat `cn()`, jadi ganti bahasa tidak mengubah data. Kategori buatan pengguna tampil apa adanya.
- Pergantian bahasa dan tema memakai crossfade View Transition.

Dibuat oleh Joel G. Thompson.

## Mata uang
- Ringkasan → Mata uang: IDR (bawaan), USD, EUR, SGD, MYR, JPY. Disimpan di `localStorage` kunci `catat.cur`.
- Mengganti mata uang mengonversi semua catatan dan anggaran dengan kurs terbaru (lihat v69). Pemisah ribuan mengikuti mata uang, bukan bahasa.
- v34: uang diformat lewat `Intl.NumberFormat` (style currency, locale per mata uang; euro tampil `7.000 €`). Simpan di sheet: abu jelas saat nonaktif, tanpa ikon centang (kunci Enter/centang keyboard sudah menyimpan), dan menempel di bawah sheet agar tidak terpotong keyboard. Ringkasan: tanpa total ganda, selalu ada breakdown per kategori. Tombol + disembunyikan di Pengaturan. Ringkas: catatan kecil mata uang dihapus; Batal di dialog reset dibuat tenang (tanpa isi/outline).
- v35: tombol Pengaturan pindah ke pojok kiri atas (tab bar tinggal Beranda & Ringkasan). Judul bulan di tengah, tidak bisa diketuk; ganti bulan lewat panah kiri/kanan. Kategori di sheet Tambah catatan jadi satu baris yang digeser ke samping.
- v36: urutan header meniru Files: panah bulan di kiri, tombol Pengaturan (ikon gerigi) bulat di kanan.

## v44: lensa slider (analisis rekaman Apple Music iOS 26)
- Lensa kini elemen `.lz` (dibuat `lg.js`, hanya di Chromium) yang duduk DI ATAS ikon dan label, jadi isi slider ikut dibiaskan. Sebelumnya lensa ada di bawah ikon dan hanya membiaskan latar.
- Peta displacement punya dua suku: lengkung tepi (`bezel`) dan perbesaran inti (`MAG`, 1,18×). `mag`, `shift`, `bezel`, `chroma` diatur di `lens()` pada `lg.js`.
- Diam = pil gelap (`::before`). Disentuh = pil memudar, lensa muncul (scale 1,06×1,26), meregang mengikuti kecepatan geser lewat `--st` (diisi `paint()` di `liquid()`), dan rim punya bayangan gelap tipis di tepi atas dalam.
- Ikon di dalam lensa lebih tegas lewat `contrast(1,22)` pada filter lensa (aplikasi ini monokrom, jadi tanpa warna aksen).
- Spring geser: `tv=(tv+(tk-ck)*.115)*.72` (overshoot ±14%, settle ~0,5 detik).
- Safari/iOS: belum ada refraksi (batasan `backdrop-filter:url()`), tampilan tetap seperti v43.


## v45
- Bulan dan tahun (`#mon`) jadi kapsul kaca dua baris: bulan tebal di atas, tahun kecil di bawah (`monEl()` di `app.js`). Memakai kaca dan refraksi yang sama dengan tombol + (`lg.js`). Lebar minimum 136px agar tidak melompat saat pindah bulan.
- Form catatan dan anggaran: header dan tombol Simpan tetap; hanya isi (`.shb`) yang bergulir. Sebelumnya Simpan `sticky` dan menimpa kartu tanggal saat keyboard terbuka.
- Kembali dari Pengaturan: thumb tab bar tumbuh dari `scale .9×.74` sambil memudar bersamaan (tanpa jeda 0,2 detik dan fade cepat seperti sebelumnya).

## v46
- Panah bulan kiri/kanan dihapus. Ganti bulan/tahun: ketuk kapsul bulan (`#mon`, sekarang tombol) → kartu kaca mengambang tepat di bawahnya (picker `#pick`, dengan refraksi `lg.js`), atau geser daftar seperti sebelumnya.
- Pojok kiri atas: tombol tema (`#thb`). (sejak v47 hanya Gelap ⇄ Terang, lihat di bawah). Sinkron dengan Pengaturan → Tampilan. Disembunyikan di halaman Pengaturan.
- Transisi Pengaturan ⇄ Ringkasan: lebar tombol + tidak lagi overshoot (bar tidak bergoyang dan tidak saling menimpa); thumb hanya tumbuh vertikal sehingga tepinya selalu sejajar bar; peta refraksi tab bar dibulatkan (`q`) agar tidak dibuat ulang tiap frame.

## v47
- Bug slider tab bar saat Pengaturan → Ringkasan: thumb tampil menyempit dan tidak sejajar bar karena dianimasikan lewat `scale` selagi lebar bar berubah (bar menyempit mengikuti tombol +). Kini thumb hanya muncul lewat `opacity` dan tinggi lewat `top/bottom` (ikut layout tiap frame), tanpa transform. Blok v47 di akhir `style.css`.
- Menyentuh separuh kanan tab bar saat di Pengaturan tidak lagi memunculkan lensa tak terlihat (`liquid(..., off)` di `app.js`).
- Picker bulan/tahun: bulan terpilih berupa isi solid polos, tanpa bayangan dan tanpa cincin fokus ganda.
- Tombol tema (`#thb`) hanya dua kondisi: Gelap ⇄ Terang. Pengguna baru (belum memilih) mengikuti tema sistem dan ikon menampilkan tema yang sedang aktif; ketukan pertama membalik tema itu lalu tersimpan di `catat.theme`. Pengaturan → Tampilan tetap punya opsi Otomatis untuk kembali mengikuti sistem.
- Pengaturan → Tampilan/Bahasa/Mata uang memakai menu kaca buatan sendiri (`openMenu()` di `app.js`), bukan popup `<select>` bawaan iOS yang berkedip hitam saat dibuka. `<select>` tetap jadi penyimpan nilai (disembunyikan).
- Cincin fokus (`:focus-visible`) hanya tampil setelah Tab/panah ditekan (`html.kb`, diatur `app.js`); fokus otomatis (mis. Batal di dialog reset) tidak lagi menampilkan outline hitam.

## v69 · konversi kurs
- Ganti mata uang (Ringkasan → Mata uang) otomatis mengonversi semua catatan dan anggaran. Kurs diambil dari Frankfurter (`api.frankfurter.dev`, kurs referensi ECB, tanpa kunci API, diperbarui tiap hari kerja sekitar 16.00 CET) setiap mata uang diganti, lalu disimpan di `localStorage` kunci `catat.fx` (`{t, d, r}`, basis USD). Tanpa internet atau saat permintaan gagal/timeout (7 detik), dipakai kurs tersimpan terakhir. Kalau belum pernah ada kurs tersimpan dan sedang offline, mata uang tidak diganti dan muncul pesan.
- Kalau belum ada catatan atau anggaran, mata uang langsung diganti (kurs tetap diambil di latar supaya siap offline).
- Hasil konversi dibulatkan ke satuan terkecil mata uang tujuan (IDR/JPY bulat, lainnya 2 desimal; minimal satu satuan terkecil). Lihat v71 untuk nilai asli. Snackbar Kembalikan memulihkan nilai persis seperti sebelum konversi (selama snackbar tampil).
- Nominal kini boleh berdesimal untuk USD/EUR/SGD/MYR (`CURD` di `app.js`); `inputmode="decimal"`. Ketik titik atau koma sebagai pemisah desimal; tampilannya mengikuti locale mata uang. `parseIn()` mengubah teks ketikan jadi string kanonik, `fmtIn()` memformatnya kembali. Validasi nominal lewat `okAmt()` (maks 2 desimal). Data lama (bilangan bulat) tetap valid tanpa migrasi.
- Cadangan menyimpan `cur`. Memulihkan cadangan dari mata uang lain mengonversi isinya ke mata uang sekarang (butuh kurs); cadangan lama tanpa `cur` diimpor apa adanya.
- CSP: `connect-src 'self' https://api.frankfurter.dev` di `_headers` dan `render.yaml` (harus sama). Tidak ada permintaan jaringan lain.
- `sw.js` ditulis ulang (berkas di zip v68 kosong): precache semua berkas, halaman jaringan-dulu, aset cache-dulu, hanya satu origin. Naikkan `V` setiap rilis.

## v70 · Cara pakai dan Syarat & ketentuan
- Pengaturan punya kartu baru (di atas Reset) dengan dua baris: **Cara pakai** dan **Syarat & ketentuan**. Keduanya membuka satu dialog kaca `#inf` yang sama gayanya dengan dialog Kategori (header + tombol tutup tetap, isi `.cbody` bergulir dengan pudar di tepi, tumbuh dari baris yang diketuk lewat `setOrigin`).
- Isi ada di objek `INFO` di `app.js`; setiap teks berupa `[Indonesia, English]` dan dirender ulang dengan `paintInfo()` sesuai bahasa. Tambah atau ubah butir: edit array `i` (judul, isi). Bukan lewat kamus `EN`.
- Tampilan: kartu daftar bernomor (`.il`/`.ir`, blok v70 di akhir `style.css`), hanya token yang sudah ada, teks sekunder minimal 14px.
- Teks Syarat & ketentuan adalah templat umum yang mengikuti perilaku aplikasi (data lokal, satu permintaan jaringan ke `api.frankfurter.dev`, tanpa analitik). Belum ada klausul hukum yang berlaku, kontak, atau kebijakan privasi terpisah: tinjau dan lengkapi sebelum rilis, dan ubah tanggal "Terakhir diperbarui" bila isinya berubah.

## v71 · konversi bolak-balik tidak menggeser angka
- Bug v69/v70: konversi berantai lewat pembulatan sen (Rp1.000.000 → USD → IDR jadi Rp1.000.024). Sekarang tiap catatan dan anggaran menyimpan nilai asli `o:{c,a}` (mata uang + nominal saat terakhir diketik). `convTx()` selalu menghitung dari nilai asli: kembali ke mata uang asli memulihkan nominal persis; ke mata uang lain hanya satu kali pembulatan dari nilai asli (tanpa akumulasi).
- `o` diisi saat menyimpan catatan/anggaran (dipertahankan bila nominal tidak diubah saat edit), ikut cadangan, dan dicek `cleanO()`. Data tanpa `o` dianggap asli di mata uang saat konversi pertama. Catatan yang sudah telanjur bergeser (mis. 1.000.024) tidak bisa dipulihkan otomatis: edit nominalnya sekali.

## v72
- Dialog Cara pakai / Syarat & ketentuan tidak bisa digulir: `.card` (overflow:hidden) di dalam `.cbody` yang berupa grid diperas ke tinggi dialog sehingga isi terpotong. `#infb` kini `display:block`. Hati-hati: jangan taruh kartu ber-overflow:hidden langsung di grid/flex yang tingginya dibatasi.
- Tautan kecil bergaris bawah "Cara pakai · Syarat & ketentuan" di bawah daftar Beranda (`.legal`, `#hw2`/`#tc2`); baris di Pengaturan tetap ada. Keduanya memanggil `openInfo()`.

