/*
 * Zero Plastic – pencari tempat setor sampah plastik terdekat.
 *
 * Alur singkat:
 * 1. Data lokasi dibaca dari data/lokasi.json.
 * 2. Pengunjung menekan tombol → browser meminta izin lokasi.
 * 3. Jarak ke setiap lokasi dihitung (rumus haversine), 3 terdekat ditampilkan.
 * 4. Jika izin ditolak, pengunjung bisa mengetuk peta untuk menandai posisinya.
 *
 * Lokasi pengunjung TIDAK disimpan dan TIDAK dikirim ke mana pun.
 */

// ===== Pengaturan (aman diubah) =====
const PENGATURAN = {
  fileData: "data/lokasi.json",
  pusatAwal: [-7.2575, 112.7521], // Surabaya
  zoomAwal: 12,
  jumlahHasil: 3,
  batasJauhKm: 25
};

// Nama tampilan untuk jenis plastik. Jenis yang tidak ada di sini tetap
// muncul sebagai filter dengan nama aslinya dari lokasi.json.
const LABEL_PLASTIK = {
  PET: "PET (botol minum)",
  HDPE: "HDPE (botol sampo, galon)",
  PP: "PP (gelas plastik, tutup botol)",
  kresek: "Kresek",
  sachet: "Sachet / bungkus",
  styrofoam: "Styrofoam"
};

// ===== Perhitungan (tanpa tampilan) =====

// Jarak garis lurus antara dua titik di bumi, dalam kilometer.
function jarakKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function lokasiValid(l) {
  return (
    l && typeof l.nama === "string" &&
    typeof l.lat === "number" && Number.isFinite(l.lat) && l.lat >= -90 && l.lat <= 90 &&
    typeof l.lng === "number" && Number.isFinite(l.lng) && l.lng >= -180 && l.lng <= 180
  );
}

function terimaPlastik(lokasi, jenis) {
  const cari = jenis.toLowerCase();
  return (lokasi.plastik_diterima || []).some(p => String(p).toLowerCase() === cari);
}

// Mengurutkan lokasi dari yang terdekat. Jika jenisPlastik diisi,
// hanya lokasi yang menerima jenis itu yang diikutkan.
function urutkanLokasi(daftarLokasi, lat, lng, jenisPlastik) {
  return daftarLokasi
    .filter(l => !jenisPlastik || terimaPlastik(l, jenisPlastik))
    .map(l => ({ lokasi: l, jarak: jarakKm(lat, lng, l.lat, l.lng) }))
    .sort((a, b) => a.jarak - b.jarak);
}

function formatJarak(km) {
  if (km < 1) return Math.max(10, Math.round(km * 100) * 10) + " m";
  return km.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " km";
}

function labelPlastik(jenis) {
  const kunci = Object.keys(LABEL_PLASTIK).find(k => k.toLowerCase() === String(jenis).toLowerCase());
  return kunci ? LABEL_PLASTIK[kunci] : jenis;
}

function linkArah(lat, lng) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
}

function linkCariBankSampah(lat, lng) {
  return "https://www.google.com/maps/search/bank+sampah/@" + lat.toFixed(5) + "," + lng.toFixed(5) + ",14z";
}

// ===== Tampilan =====

const keadaan = {
  semuaLokasi: [],
  posisi: null, // { lat, lng, sumber: "gps" | "manual" }
  filter: null,
  peta: null,
  lapisan: null
};

// Membuat elemen HTML. Teks selalu dipasang sebagai teks biasa (aman).
function el(tag, atribut, isi) {
  const e = document.createElement(tag);
  Object.entries(atribut || {}).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else e.setAttribute(k, v);
  });
  [].concat(isi || []).forEach(anak => {
    if (anak === null || anak === undefined) return;
    e.append(typeof anak === "string" ? document.createTextNode(anak) : anak);
  });
  return e;
}

const $ = id => document.getElementById(id);

function setStatus(teks) {
  $("status").textContent = teks;
}

async function muatData() {
  const res = await fetch(PENGATURAN.fileData, { cache: "no-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("lokasi.json harus berupa array [ ... ]");
  return data.filter(l => {
    if (lokasiValid(l)) return true;
    console.warn("Lokasi dilewati karena nama/lat/lng tidak valid:", l);
    return false;
  });
}

function tampilkanInfoData() {
  const belum = keadaan.semuaLokasi.filter(l => !l.terverifikasi).length;
  $("info-data").textContent = belum
    ? "⚠️ " + belum + " dari " + keadaan.semuaLokasi.length +
      " lokasi masih data contoh / belum terverifikasi. Jangan dijadikan patokan dulu."
    : "Semua lokasi sudah diverifikasi oleh tim Zero Plastic.";
}

function buatFilter() {
  const urutanLabel = Object.keys(LABEL_PLASTIK).map(k => k.toLowerCase());
  const jenis = new Map();
  keadaan.semuaLokasi.forEach(l =>
    (l.plastik_diterima || []).forEach(p => {
      const k = String(p).toLowerCase();
      if (!jenis.has(k)) jenis.set(k, String(p));
    })
  );
  const urut = [...jenis.keys()].sort((a, b) => {
    const ia = urutanLabel.indexOf(a), ib = urutanLabel.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });

  const wadah = $("filter");
  wadah.innerHTML = "";
  const pilihan = [{ nilai: null, label: "Semua" }].concat(
    urut.map(k => ({ nilai: jenis.get(k), label: labelPlastik(jenis.get(k)) }))
  );
  pilihan.forEach(p => {
    const chip = el("button", { type: "button", class: "chip", "aria-pressed": String(p.nilai === keadaan.filter) }, p.label);
    chip.addEventListener("click", () => {
      keadaan.filter = p.nilai;
      wadah.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      tampilkanHasil();
    });
    wadah.append(chip);
  });
}

function siapkanPeta() {
  if (keadaan.peta || typeof L === "undefined") return;
  const peta = L.map("peta").setView(PENGATURAN.pusatAwal, PENGATURAN.zoomAwal);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(peta);
  keadaan.lapisan = L.layerGroup().addTo(peta);
  peta.on("click", e => aturPosisi(e.latlng.lat, e.latlng.lng, "manual"));
  keadaan.peta = peta;
}

function ikon(kelas, teks, ukuran) {
  return L.divIcon({
    className: "",
    html: '<div class="penanda ' + kelas + '">' + (teks || "") + "</div>",
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran / 2],
    popupAnchor: [0, -ukuran / 2]
  });
}

function isiPopup(lokasi, jarak) {
  return el("div", {}, [
    el("strong", {}, lokasi.nama),
    el("br"),
    lokasi.jenis + " · " + formatJarak(jarak),
    el("br"),
    el("a", { href: linkArah(lokasi.lat, lokasi.lng), target: "_blank", rel: "noopener" }, "🧭 Arahkan")
  ]);
}

function gambarPeta(teratas, semua) {
  const { peta, lapisan, posisi } = keadaan;
  if (!peta) return [];
  lapisan.clearLayers();

  const idTeratas = new Set(teratas.map(h => h.lokasi));
  semua.filter(h => !idTeratas.has(h.lokasi)).forEach(h =>
    L.marker([h.lokasi.lat, h.lokasi.lng], { icon: ikon("penanda-lain", "", 14) })
      .bindPopup(isiPopup(h.lokasi, h.jarak))
      .addTo(lapisan)
  );

  const penanda = teratas.map((h, i) =>
    L.marker([h.lokasi.lat, h.lokasi.lng], {
      icon: i === 0 ? ikon("penanda-terbaik", "★", 40) : ikon("", String(i + 1), 30),
      zIndexOffset: 1000 - i * 100,
      title: h.lokasi.nama
    })
      .bindPopup(isiPopup(h.lokasi, h.jarak))
      .addTo(lapisan)
  );

  L.circleMarker([posisi.lat, posisi.lng], {
    radius: 9, color: "#fff", weight: 3, fillColor: "#1a73e8", fillOpacity: 1
  }).bindPopup(posisi.sumber === "gps" ? "Posisimu" : "Titik yang kamu tandai").addTo(lapisan);

  if (teratas.length) {
    const batas = L.latLngBounds([[posisi.lat, posisi.lng]].concat(teratas.map(h => [h.lokasi.lat, h.lokasi.lng])));
    peta.fitBounds(batas, { padding: [40, 40], maxZoom: 15 });
  } else {
    peta.setView([posisi.lat, posisi.lng], 13);
  }
  return penanda;
}

function buatKartu(hasil, urutan, penanda) {
  const { lokasi, jarak } = hasil;
  const terbaik = urutan === 0;
  const lencana = [
    el("span", { class: "lencana" + (terbaik ? " lencana-terbaik" : "") },
      terbaik ? (keadaan.filter ? "⭐ Paling cocok" : "⭐ Paling dekat") : "#" + (urutan + 1)),
    lokasi.terverifikasi ? null : el("span", { class: "lencana lencana-belum" }, "Belum terverifikasi")
  ];

  const detail = el("dl", {}, [
    el("dt", {}, "Jenis tempat"), el("dd", {}, lokasi.jenis || "-"),
    el("dt", {}, "Plastik yang diterima"),
    el("dd", {}, (lokasi.plastik_diterima || []).map(labelPlastik).join(", ") || "-"),
    el("dt", {}, "Jam buka"), el("dd", {}, lokasi.jam_buka || "Belum ada info"),
    lokasi.alamat ? el("dt", {}, "Alamat") : null, lokasi.alamat ? el("dd", {}, lokasi.alamat) : null,
    lokasi.kontak ? el("dt", {}, "Kontak") : null, lokasi.kontak ? el("dd", {}, lokasi.kontak) : null
  ]);

  const kartu = el("li", { class: "kartu" + (terbaik ? " kartu-terbaik" : "") }, [
    el("div", {}, lencana),
    el("h3", {}, lokasi.nama),
    el("div", { class: "jarak" }, formatJarak(jarak)),
    detail,
    el("a", { class: "tombol-arah", href: linkArah(lokasi.lat, lokasi.lng), target: "_blank", rel: "noopener" }, "🧭 Arahkan")
  ]);

  // Ketuk kartu → tunjukkan tempatnya di peta.
  kartu.addEventListener("click", e => {
    if (e.target.closest("a") || !penanda) return;
    keadaan.peta.setView(penanda.getLatLng(), Math.max(keadaan.peta.getZoom(), 15));
    penanda.openPopup();
    $("peta").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return kartu;
}

function tampilkanPeringatan(teratas) {
  const kotak = $("peringatan");
  const { lat, lng } = keadaan.posisi;
  const fallback = el("a", { href: linkCariBankSampah(lat, lng), target: "_blank", rel: "noopener" },
    "🔎 Cari \"bank sampah\" di sekitarmu lewat Google Maps");
  let pesan = null;

  if (!teratas.length) {
    pesan = keadaan.filter
      ? "Belum ada tempat di data kami yang menerima " + labelPlastik(keadaan.filter) + ". Coba pilih jenis lain, atau:"
      : "Belum ada data lokasi. Coba cari langsung di Google Maps:";
  } else if (teratas[0].jarak > PENGATURAN.batasJauhKm) {
    pesan = "Jujur saja, tempat terdekat di data kami berjarak " + formatJarak(teratas[0].jarak) +
      " darimu, cukup jauh. Data kami masih terbatas, jadi mungkin ada tempat yang lebih dekat tapi belum tercatat:";
  }

  kotak.innerHTML = "";
  kotak.hidden = !pesan;
  if (pesan) kotak.append(el("p", {}, pesan), fallback);
}

function tampilkanHasil() {
  if (!keadaan.posisi) return;
  const { lat, lng } = keadaan.posisi;
  const semua = urutkanLokasi(keadaan.semuaLokasi, lat, lng, keadaan.filter);
  const teratas = semua.slice(0, PENGATURAN.jumlahHasil);

  const penanda = gambarPeta(teratas, semua);
  tampilkanPeringatan(teratas);

  const daftar = $("daftar");
  daftar.innerHTML = "";
  teratas.forEach((h, i) => daftar.append(buatKartu(h, i, penanda[i])));
  $("judul-hasil").hidden = !teratas.length;
  $("judul-hasil").textContent = keadaan.filter
    ? "Tempat terdekat yang menerima " + labelPlastik(keadaan.filter)
    : "Tempat terdekat untukmu";
}

function aturPosisi(lat, lng, sumber) {
  keadaan.posisi = { lat, lng, sumber };
  setStatus(sumber === "gps"
    ? "✅ Lokasimu ditemukan."
    : "📌 Dihitung dari titik yang kamu tandai. Ketuk peta lagi untuk memindahkannya.");
  tampilkanHasil();
}

function modeManual(alasan) {
  let pesan = alasan + " Ketuk peta untuk menandai posisimu, lalu kami carikan tempat terdekat dari titik itu.";
  if (/Instagram|FBAN|FBAV/i.test(navigator.userAgent)) {
    pesan += " Tips: kalau dibuka dari Instagram, coba buka lewat Chrome/Safari (menu ⋯ → Buka di browser).";
  }
  setStatus(pesan);
  if (!keadaan.posisi && keadaan.peta) keadaan.peta.setView(PENGATURAN.pusatAwal, PENGATURAN.zoomAwal);
  $("status").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function cari(dataSiap) {
  const tombol = $("tombol-cari");
  $("area-hasil").hidden = false;
  siapkanPeta();
  if (keadaan.peta) keadaan.peta.invalidateSize();
  else $("petunjuk-peta").textContent = "Peta gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.";

  try {
    await dataSiap;
  } catch (err) {
    setStatus("❌ Data lokasi gagal dimuat. Coba muat ulang halaman.");
    console.error(err);
    return;
  }

  if (!navigator.geolocation) {
    modeManual("Browser ini tidak mendukung deteksi lokasi.");
    return;
  }

  tombol.disabled = true;
  setStatus("Meminta izin lokasi…");
  navigator.geolocation.getCurrentPosition(
    pos => {
      tombol.disabled = false;
      tombol.textContent = "📍 Cari ulang dari lokasiku";
      aturPosisi(pos.coords.latitude, pos.coords.longitude, "gps");
    },
    err => {
      tombol.disabled = false;
      const alasan = {
        1: "Izin lokasi ditolak.",
        2: "Lokasimu tidak dapat ditemukan.",
        3: "Pencarian lokasi terlalu lama."
      }[err.code] || "Lokasi tidak tersedia.";
      modeManual(alasan);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}

function mulai() {
  const dataSiap = muatData().then(data => {
    keadaan.semuaLokasi = data;
    tampilkanInfoData();
    buatFilter();
  });
  dataSiap.catch(err => console.error("Gagal memuat " + PENGATURAN.fileData + ":", err));
  $("tombol-cari").addEventListener("click", () => cari(dataSiap));
}

if (typeof document !== "undefined") mulai();
