# CLAUDE.md – Zero Plastic (zero-plastic)

## Goal
Free website for "Zero Plastic", a student social campaign in Indonesia. After the
visitor allows location access, it picks the nearest / best-matching plastic waste
drop-off point (bank sampah, TPS3R, pengepul) from `data/lokasi.json` and links to
Google Maps directions.

## Hard constraints
- Static site only, hosted on GitHub Pages (served under the `/zero-plastic/` subpath).
  No server, no backend, no build step.
- No paid APIs and no API keys in the code (the repo is public).
- Map: Leaflet + OpenStreetMap tiles, loaded from a CDN (unpkg, pinned version with
  SRI `integrity`; update the hash if the version changes).
- All UI text in Bahasa Indonesia. Mobile-first: most visitors come from Instagram on phones.
  Must work at ~375px width with no horizontal scroll.
- Plain HTML/CSS/JS, no framework. Keep it easy for non-developers to maintain.
- All paths relative (`style.css`, `app.js`, `data/lokasi.json`). Never use leading `/`.
- Visitor location is processed only in the browser: never stored, logged or sent anywhere.

## File structure
```
index.html          Page markup, loads Leaflet from CDN, style.css, app.js
style.css           All styles (theme colors as CSS variables in :root)
app.js              Pure logic at top (jarakKm, urutkanLokasi, ...), DOM code below.
                    DOM init is guarded by `typeof document` so the logic can be
                    loaded in Node for tests.
data/lokasi.json    Location data (array)
README.md           Maintainer guide in Bahasa Indonesia
.nojekyll           Serve files as-is on GitHub Pages
```

## Data schema (`data/lokasi.json`)
Array of objects:

| field | type | required | notes |
|---|---|---|---|
| `id` | string | yes | unique |
| `nama` | string | yes | |
| `lat` | number | yes | -90..90 (Surabaya ≈ -7.x) |
| `lng` | number | yes | -180..180 (Surabaya ≈ 112.x) |
| `alamat` | string | yes | |
| `jenis` | string | yes | e.g. "bank sampah", "TPS3R", "pengepul" |
| `plastik_diterima` | string[] | yes | e.g. ["PET","HDPE","PP","kresek","sachet","styrofoam"]; matched case-insensitively; display labels in `LABEL_PLASTIK` in app.js |
| `jam_buka` | string | yes | free text |
| `kontak` | string | no | only with the owner's consent |
| `terverifikasi` | boolean | yes | |

Entries with invalid `nama`/`lat`/`lng` are skipped by app.js (console warning).

## Placeholder data rule
Placeholder data MUST stay clearly labelled until replaced with verified data:
- `nama` starts with `[CONTOH]` and `terverifikasi` is `false`.
- Do not invent real business names, phone numbers or social handles. Use generic
  names ("Titik 1 (area Gubeng)") and `example.com` for dummy contacts.
- Never flip `terverifikasi` to `true` or drop the `[CONTOH]` prefix unless the
  maintainers supply verified real data.

## Behaviour notes
- Ranking: optional plastic filter first, then haversine (straight-line) distance; top 3 shown.
- Nearest result > 25 km (`PENGATURAN.batasJauhKm`) → honest warning + Google Maps
  "bank sampah" search fallback. Same fallback when a filter yields no results.
- Geolocation denied/unavailable → map centred on Surabaya; tapping the map sets the position.
- Directions link: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG` (new tab).
- Render data via `textContent` / DOM nodes, never `innerHTML` with data values.

## Out of scope (for now)
Public location submissions (planned: Google Form → Sheet → manual JSON update). Don't build it.

## Checking changes
- `data/lokasi.json` must parse; every entry needs valid lat/lng.
- Test locally with `python3 -m http.server` (fetch doesn't work from `file://`).
