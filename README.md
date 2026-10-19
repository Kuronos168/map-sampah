# ♻️ Zero Plastic – Peta Tempat Setor Sampah Plastik

Situs sederhana untuk kampanye sosial pelajar **Zero Plastic**. Pengunjung menekan
tombol **"Cari tempat terdekat"**, mengizinkan akses lokasi, lalu situs langsung
menampilkan **3 tempat setor sampah plastik terdekat** (bank sampah, TPS3R,
pengepul) lengkap dengan jarak, jenis plastik yang diterima, jam buka, dan tombol
**"Arahkan"** ke Google Maps.

> ⚠️ **Data saat ini masih CONTOH.** Semua lokasi di `data/lokasi.json` berawalan
> `[CONTOH]` dan bukan tempat sungguhan. Ganti dengan data yang sudah dicek
> sebelum situs disebarkan.

## Fitur

- 📍 Cari otomatis tempat terdekat dari lokasi pengunjung.
- 🧴 Filter jenis plastik (PET, HDPE, kresek, dll.). Kalau dipilih, hanya tempat
  yang menerima jenis itu yang diurutkan.
- 🗺️ Peta (Leaflet + OpenStreetMap), tempat terbaik ditandai ★.
- 👆 Kalau izin lokasi ditolak, pengunjung bisa **mengetuk peta** untuk menandai posisinya.
- 🔎 Kalau tempat terdekat lebih dari 25 km, situs memberi tahu dengan jujur dan
  menawarkan pencarian "bank sampah" di Google Maps.
- 🔒 Lokasi pengunjung hanya diproses di browser, **tidak disimpan** dan tidak dikirim ke mana pun.
- Gratis: tanpa server, tanpa API berbayar, tanpa API key.

## Isi folder

```
index.html          Halaman utama
style.css           Tampilan (warna, ukuran)
app.js              Logika: hitung jarak, peta, kartu hasil
data/lokasi.json    DAFTAR LOKASI ← file yang paling sering diubah
.nojekyll           Supaya GitHub Pages menyajikan file apa adanya
```

## Cara menambah / mengubah lokasi

Semua lokasi ada di **`data/lokasi.json`**. File ini berisi daftar yang diapit
`[` dan `]`, setiap lokasi diapit `{` dan `}`, dan **antar-lokasi dipisah koma**.

### Contoh satu lokasi

```json
{
  "id": "bs-gubeng-01",
  "nama": "Bank Sampah Melati",
  "lat": -7.275612,
  "lng": 112.750834,
  "alamat": "Jl. Contoh No. 1, Gubeng, Surabaya",
  "jenis": "bank sampah",
  "plastik_diterima": ["PET", "HDPE", "PP", "kresek"],
  "jam_buka": "Sabtu 08.00–11.00",
  "kontak": "0812-xxxx-xxxx (Bu Ani)",
  "terverifikasi": true
}
```

| Kolom | Wajib? | Keterangan |
|---|---|---|
| `id` | ya | Kode unik, bebas tapi tidak boleh sama dengan lokasi lain. Contoh: `bs-gubeng-01`. |
| `nama` | ya | Nama tempat. |
| `lat`, `lng` | ya | Koordinat (angka, **tanpa tanda kutip**, pakai titik bukan koma). Di Surabaya/Sidoarjo `lat` selalu **minus** (sekitar `-7.xxx`) dan `lng` sekitar `112.xxx`. |
| `alamat` | ya | Alamat lengkap. |
| `jenis` | ya | Misalnya `"bank sampah"`, `"TPS3R"`, `"pengepul"`. |
| `plastik_diterima` | ya | Daftar jenis plastik. Pakai nama yang sudah ada supaya filternya menyatu: `"PET"`, `"HDPE"`, `"PP"`, `"kresek"`, `"sachet"`, `"styrofoam"`. Jenis baru otomatis muncul sebagai filter. |
| `jam_buka` | ya | Teks bebas, misalnya `"Senin–Jumat 08.00–15.00"`. |
| `kontak` | tidak | Nomor/IG/email. Boleh dihapus kalau tidak ada. **Pastikan pemiliknya setuju kontaknya ditampilkan.** |
| `terverifikasi` | ya | `true` kalau tim sudah memastikan tempatnya ada & menerima plastik, `false` kalau belum. |

### Cara mendapatkan koordinat dari Google Maps

**Di HP:**
1. Buka Google Maps, cari tempatnya.
2. **Tekan lama** tepat di titik lokasinya sampai muncul pin merah.
3. Koordinat muncul di kolom pencarian atas, misalnya `-7.275612, 112.750834`.
4. Angka pertama = `lat`, angka kedua = `lng`.

**Di laptop:**
1. Buka [maps.google.com](https://maps.google.com), cari tempatnya.
2. **Klik kanan** di titik lokasinya.
3. Klik baris paling atas (angka koordinat), otomatis tersalin.
4. Tempel, lalu pisahkan: angka pertama = `lat`, angka kedua = `lng`.

### Mengedit langsung di GitHub (tanpa install apa pun)

1. Buka file `data/lokasi.json` di GitHub, klik ikon ✏️ (Edit).
2. Salin satu blok `{ ... }` yang sudah ada, tempel di bawahnya, beri **koma** di antara keduanya, lalu ubah isinya.
3. Klik **Commit changes**.
4. Tunggu 1–2 menit, lalu buka situsnya untuk mengecek.

**Tips agar tidak error:**
- Lokasi terakhir **tidak boleh** diikuti koma.
- Teks pakai tanda kutip dua `"..."`; angka dan `true`/`false` **tanpa** kutip.
- Kalau ragu, tempel seluruh isi file ke [jsonlint.com](https://jsonlint.com) untuk dicek.
- Kalau situs menampilkan "Data lokasi gagal dimuat", hampir pasti ada salah ketik di `lokasi.json`.

### Mengganti data contoh

Lokasi berawalan `[CONTOH]` hanyalah data percobaan. Hapus semuanya setelah ada
data sungguhan. Situs otomatis menampilkan peringatan di bawah halaman selama
masih ada lokasi dengan `"terverifikasi": false`.

## Rencana: lokasi kiriman masyarakat (belum dibuat)

Nanti masyarakat bisa mengusulkan lokasi lewat **Google Form**. Alurnya:

1. Jawaban Google Form masuk ke Google Sheet.
2. Tim mengecek kebenarannya (telepon / datang langsung).
3. Tim menambahkan lokasi yang valid ke `data/lokasi.json` seperti cara di atas.

Situs ini tidak perlu diubah untuk alur itu, cukup `lokasi.json` yang diperbarui.
Tautan ke formulir nanti bisa ditambahkan di bagian `<footer>` pada `index.html`.

## Cara mengaktifkan GitHub Pages

1. Di repo GitHub, buka **Settings → Pages**.
2. Di **Build and deployment → Source**, pilih **Deploy from a branch**.
3. Pilih branch **`main`** dan folder **`/ (root)`**, lalu **Save**.
4. Tunggu 1–2 menit. Situs akan tersedia di
   **`https://kuronos168.github.io/zero-plastic/`**.

Setiap kali ada perubahan di branch `main`, situs otomatis diperbarui.

## Mencoba di komputer sendiri (opsional)

Membuka `index.html` langsung (klik dua kali) **tidak akan memuat data**, karena
browser memblokir pembacaan file lokal. Jalankan server kecil dari folder repo:

```bash
python3 -m http.server 8000
```

lalu buka `http://localhost:8000`. Deteksi lokasi hanya berjalan di `localhost`
atau situs `https://` (GitHub Pages sudah `https`).

## Catatan

- Jarak dihitung **garis lurus**, bukan jarak tempuh jalan.
- Peta © kontributor [OpenStreetMap](https://www.openstreetmap.org/copyright).
- Jika dibuka dari aplikasi Instagram dan lokasi tidak terdeteksi, buka lewat
  Chrome/Safari (menu ⋯ → Buka di browser), atau ketuk peta untuk menandai posisi.
