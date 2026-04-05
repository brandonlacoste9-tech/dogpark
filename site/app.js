import { COUNTRY_LABELS, regionLabel } from "./region-labels.js";
import { addReview, getReviewSummary, getReviewsForPark } from "./reviews-store.js";

/**
 * @typedef {{ id: string, name: string, lat: number, lon: number, country: string | null, province: string | null, city: string | null, website?: string | null }} Park
 */

/** @type {Park[]} */
let allParks = [];
/** @type {import("leaflet").Map | null} */
let map = null;
/** @type {import("leaflet").LayerGroup | null} */
let markers = null;
/** @type {import("leaflet").Marker | null} */
let activeMarker = null;

/** @type {Park | null} */
let reviewsModalPark = null;

function norm(s) {
  return s.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

/**
 * @param {Park} park
 * @param {string} q
 * @param {string} country
 * @param {string} regionKey country|province
 */
function matches(park, q, country, regionKey) {
  if (country && park.country !== country) return false;
  if (regionKey) {
    const [c, r] = regionKey.split("|");
    if (park.country !== c || park.province !== r) return false;
  }
  if (!q) return true;
  const reg = regionLabel(park.country, park.province);
  const ctry = park.country ? COUNTRY_LABELS[park.country] ?? park.country : "";
  const hay = norm(
    [park.name, park.city, park.province, park.website, reg, ctry].filter(Boolean).join(" "),
  );
  return hay.includes(norm(q));
}

/** @param {string | null | undefined} url */
function safeHref(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    /* ignore */
  }
  return null;
}

function formatPlaceLine(p) {
  const bits = [];
  if (p.city) bits.push(p.city);
  const rl = regionLabel(p.country, p.province);
  if (rl) bits.push(rl);
  if (p.country && COUNTRY_LABELS[p.country]) bits.push(COUNTRY_LABELS[p.country]);
  return bits.join(" · ") || "North America";
}

/** @returns {{ la: number, lo: number } | null} */
function mapCoords(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return { la, lo };
}

function staticMapImageUrl(la, lo) {
  const q = new URLSearchParams({
    center: `${la},${lo}`,
    zoom: "15",
    size: "280x120",
    maptype: "mapnik",
    markers: `${la},${lo},red-pushpin`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${q.toString()}`;
}

/** @param {Park} p */
function appendMapLinksRow(li, p) {
  const c = mapCoords(p.lat, p.lon);
  if (!c) return;
  const { la, lo } = c;
  const wrap = document.createElement("div");
  wrap.className = "park-maps";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Open this location in other maps");

  const addLink = (label, href) => {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    a.addEventListener("click", (e) => e.stopPropagation());
    return a;
  };

  const sep = () => {
    const s = document.createElement("span");
    s.className = "park-maps__sep";
    s.setAttribute("aria-hidden", "true");
    s.textContent = "·";
    return s;
  };

  wrap.appendChild(addLink("Map", `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=15/${la}/${lo}`));
  wrap.appendChild(sep());
  wrap.appendChild(addLink("Google Maps", `https://www.google.com/maps?q=${la},${lo}`));
  wrap.appendChild(sep());
  wrap.appendChild(addLink("Apple Maps", `https://maps.apple.com/?ll=${la},${lo}`));
  li.appendChild(wrap);
}

/** @param {HTMLElement} host */
function syncStarButtons(host, value) {
  const v = Math.min(5, Math.max(1, Number(value) || 5));
  host.querySelectorAll(".star-input__btn").forEach((b) => {
    const n = Number(/** @type {HTMLElement} */ (b).dataset.value);
    b.classList.toggle("star-input__btn--active", n <= v);
  });
}

function initStarInput() {
  const host = document.getElementById("star-input");
  const hidden = document.getElementById("reviews-rating-value");
  if (!host || !hidden) return;
  host.replaceChildren();
  for (let v = 1; v <= 5; v++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star-input__btn";
    b.textContent = "★";
    b.dataset.value = String(v);
    b.setAttribute("aria-label", `${v} star${v > 1 ? "s" : ""}`);
    b.addEventListener("click", () => {
      hidden.value = String(v);
      syncStarButtons(host, v);
    });
    host.appendChild(b);
  }
  syncStarButtons(host, Number(hidden.value) || 5);
}

function renderDialogReviewList(parkId) {
  const list = document.getElementById("reviews-dialog-list");
  if (!list) return;
  const revs = getReviewsForPark(parkId);
  list.replaceChildren();
  if (revs.length === 0) {
    const p = document.createElement("p");
    p.className = "reviews-dialog__empty";
    p.textContent = "No reviews yet in this browser. Add yours below.";
    list.appendChild(p);
    return;
  }
  for (const r of revs) {
    const card = document.createElement("article");
    card.className = "review-card";
    const head = document.createElement("div");
    head.className = "review-card__head";
    const stars = document.createElement("span");
    stars.className = "review-card__stars";
    stars.setAttribute("aria-label", `${r.rating} out of 5`);
    stars.textContent = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const who = document.createElement("span");
    who.className = "review-card__author";
    who.textContent = r.author;
    const when = document.createElement("time");
    when.className = "review-card__time";
    when.dateTime = r.createdAt;
    when.textContent = new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" });
    head.appendChild(stars);
    head.appendChild(who);
    head.appendChild(when);
    const body = document.createElement("p");
    body.className = "review-card__text";
    body.textContent = r.text;
    card.appendChild(head);
    card.appendChild(body);
    list.appendChild(card);
  }
}

/** @param {Park} p */
function openReviewsModal(p) {
  const dialog = document.getElementById("reviews-dialog");
  const parkEl = document.getElementById("reviews-dialog-park");
  const err = document.getElementById("reviews-form-error");
  const form = document.getElementById("reviews-form");
  if (!dialog || !parkEl) return;
  reviewsModalPark = p;
  parkEl.textContent = p.name;
  renderDialogReviewList(p.id);
  if (form) {
    form.reset();
    const hidden = document.getElementById("reviews-rating-value");
    if (hidden) hidden.value = "5";
    const host = document.getElementById("star-input");
    if (host) syncStarButtons(host, 5);
  }
  if (err) {
    err.hidden = true;
    err.textContent = "";
  }
  dialog.showModal();
}

/** @param {Park} p */
function appendReviewLine(li, p) {
  const row = document.createElement("div");
  row.className = "park-review-line";
  const sum = getReviewSummary(p.id);
  const meta = document.createElement("span");
  meta.className = "park-review-line__summary";
  if (sum) {
    meta.textContent = `${sum.avg.toFixed(1)} / 5 · ${sum.count} ${sum.count === 1 ? "review" : "reviews"}`;
    meta.setAttribute("aria-label", `Average ${sum.avg.toFixed(1)} of 5 from ${sum.count} reviews`);
  } else {
    meta.textContent = "No reviews in this browser yet";
    meta.classList.add("park-review-line__summary--empty");
  }
  const revBtn = document.createElement("button");
  revBtn.type = "button";
  revBtn.className = "park-review-line__btn";
  revBtn.textContent = sum ? "See reviews" : "Write a review";
  revBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openReviewsModal(p);
  });
  row.appendChild(meta);
  row.appendChild(revBtn);
  li.appendChild(row);
}

function initReviewsDialog() {
  initStarInput();
  document.getElementById("reviews-dialog-close")?.addEventListener("click", () => {
    document.getElementById("reviews-dialog")?.close();
  });
  document.getElementById("reviews-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = document.getElementById("reviews-form-error");
    const form = /** @type {HTMLFormElement} */ (e.target);
    if (!reviewsModalPark) return;
    const rating = Number(document.getElementById("reviews-rating-value")?.value) || 5;
    const text = /** @type {HTMLTextAreaElement} */ (form.elements.namedItem("text")).value;
    const author = /** @type {HTMLInputElement} */ (form.elements.namedItem("author")).value;
    try {
      addReview(reviewsModalPark.id, { rating, text, author });
      renderDialogReviewList(reviewsModalPark.id);
      form.reset();
      const h = document.getElementById("reviews-rating-value");
      if (h) h.value = "5";
      syncStarButtons(document.getElementById("star-input"), 5);
      if (err) err.hidden = true;
      applyFilters();
    } catch (ex) {
      if (err) {
        err.hidden = false;
        err.textContent = ex instanceof Error ? ex.message : "Could not save review.";
      }
    }
  });

  document.body.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".park-popup__reviews-btn");
    if (!btn) return;
    const id = btn.getAttribute("data-park-id");
    if (!id) return;
    const park = allParks.find((px) => px.id === id);
    if (park) openReviewsModal(park);
  });
}

/** @param {Park} p */
function buildPopupHtml(p) {
  const c = mapCoords(p.lat, p.lon);
  const line = formatPlaceLine(p);
  const web = safeHref(p.website ?? "");
  let html = `<strong>${escapeHtml(p.name)}</strong>`;
  if (c) {
    const src = staticMapImageUrl(c.la, c.lo);
    html += `<img class="park-popup__map" src="${escapeHtml(src)}" width="280" height="120" alt="Map preview near ${escapeHtml(p.name)}" loading="lazy" decoding="async" />`;
  }
  html += `<div class="park-popup__place">${escapeHtml(line)}</div>`;
  if (web) {
    html += `<a class="park-popup__web" href="${escapeHtml(web)}" target="_blank" rel="noopener noreferrer">Website</a>`;
  }
  if (c) {
    const osm = `https://www.openstreetmap.org/?mlat=${c.la}&mlon=${c.lo}#map=15/${c.la}/${c.lo}`;
    const g = `https://www.google.com/maps?q=${c.la},${c.lo}`;
    const apple = `https://maps.apple.com/?ll=${c.la},${c.lo}`;
    html += `<div class="park-popup__maps"><a href="${escapeHtml(osm)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a><span class="park-popup__dot" aria-hidden="true">·</span><a href="${escapeHtml(g)}" target="_blank" rel="noopener noreferrer">Google Maps</a><span class="park-popup__dot" aria-hidden="true">·</span><a href="${escapeHtml(apple)}" target="_blank" rel="noopener noreferrer">Apple Maps</a></div>`;
  }
  const sum = getReviewSummary(p.id);
  const revBtnLabel = sum
    ? `Reviews (${sum.count}) · ${sum.avg.toFixed(1)}★`
    : "Reviews — write one";
  html += `<button type="button" class="park-popup__reviews-btn" data-park-id="${escapeHtml(p.id)}">${escapeHtml(revBtnLabel)}</button>`;
  return html;
}

function renderList(filtered) {
  const ul = document.getElementById("list");
  const meta = document.getElementById("meta");
  if (!ul || !meta) return;

  ul.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const p of filtered.slice(0, 500)) {
    const li = document.createElement("li");
    li.className = "park-item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "park-item__main";
    btn.dataset.lat = String(p.lat);
    btn.dataset.lon = String(p.lon);
    btn.dataset.id = p.id;
    const strong = document.createElement("strong");
    strong.textContent = p.name;
    btn.appendChild(strong);
    const sub = document.createElement("span");
    sub.className = "sub";
    sub.textContent = formatPlaceLine(p);
    btn.appendChild(sub);
    btn.addEventListener("click", () => focusPark(p, btn));
    li.appendChild(btn);
    appendReviewLine(li, p);
    const href = safeHref(p.website ?? "");
    if (href) {
      const web = document.createElement("div");
      web.className = "park-website";
      const a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Website";
      a.addEventListener("click", (e) => e.stopPropagation());
      web.appendChild(a);
      li.appendChild(web);
    }
    appendMapLinksRow(li, p);
    frag.appendChild(li);
  }
  ul.appendChild(frag);

  const more =
    filtered.length > 500 ? ` Showing first 500 of ${filtered.length} matches.` : "";
  meta.textContent = `${filtered.length} park${filtered.length === 1 ? "" : "s"}${more} · ${allParks.length} total in dataset`;
}

/** @param {Park} p @param {HTMLButtonElement | null} btn */
function focusPark(p, btn) {
  if (!map || !markers) return;
  map.setView([p.lat, p.lon], Math.max(map.getZoom(), 14), { animate: true });
  document.querySelectorAll(".park-item__main.active").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (activeMarker) {
    activeMarker.setOpacity?.(1);
    activeMarker = null;
  }
  markers.eachLayer((layer) => {
    const l = /** @type {import("leaflet").Marker} */ (layer);
    if (l.getLatLng().lat === p.lat && l.getLatLng().lng === p.lon) {
      activeMarker = l;
      l.setOpacity?.(0.85);
      l.openPopup();
    }
  });
}

function countrySort(a, b) {
  const order = ["CA", "US", "MX"];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

function populateCountrySelect() {
  const sel = document.getElementById("country");
  if (!sel) return;
  const codes = [...new Set(allParks.map((p) => p.country).filter(Boolean))].sort(countrySort);
  for (const c of codes) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = COUNTRY_LABELS[c] ?? c;
    sel.appendChild(opt);
  }
}

function regionOptionKey(p) {
  if (!p.country || !p.province) return null;
  return `${p.country}|${p.province}`;
}

function populateRegionSelect() {
  const countrySel = document.getElementById("country");
  const regSel = document.getElementById("province");
  if (!regSel) return;

  const countryFilter = countrySel?.value ?? "";
  regSel.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "All regions";
  regSel.appendChild(all);

  const keys = new Set();
  for (const p of allParks) {
    const k = regionOptionKey(p);
    if (!k) continue;
    if (countryFilter && p.country !== countryFilter) continue;
    keys.add(k);
  }

  const sorted = [...keys].sort((a, b) => {
    const [ca, ra] = a.split("|");
    const [cb, rb] = b.split("|");
    const la = `${COUNTRY_LABELS[ca] ?? ca} ${regionLabel(ca, ra)}`;
    const lb = `${COUNTRY_LABELS[cb] ?? cb} ${regionLabel(cb, rb)}`;
    return la.localeCompare(lb, "en");
  });

  for (const k of sorted) {
    const [c, r] = k.split("|");
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${COUNTRY_LABELS[c] ?? c} · ${regionLabel(c, r)}`;
    regSel.appendChild(opt);
  }
}

function initMap() {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;

  map = L.map(el, { scrollWheelZoom: true }).setView([45, -100], 3);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  markers = L.layerGroup().addTo(map);
}

function redrawMap(filtered) {
  if (!map || !markers) return;
  markers.clearLayers();

  const chunk = filtered.slice(0, 3500);
  for (const p of chunk) {
    const m = L.circleMarker([p.lat, p.lon], {
      radius: 6,
      weight: 2,
      color: "#1b4332",
      fillColor: "#52b788",
      fillOpacity: 0.85,
    });
    m.bindPopup(buildPopupHtml(p), { className: "park-popup", maxWidth: 304 });
    m.on("click", () => {
      const btn = document.querySelector(`.park-item__main[data-id="${CSS.escape(p.id)}"]`);
      focusPark(p, /** @type {HTMLButtonElement} */ (btn));
    });
    markers.addLayer(m);
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyFilters() {
  const q = /** @type {HTMLInputElement} */ (document.getElementById("q"))?.value.trim() ?? "";
  const country = /** @type {HTMLSelectElement} */ (document.getElementById("country"))?.value ?? "";
  const regionKey = /** @type {HTMLSelectElement} */ (document.getElementById("province"))?.value ?? "";
  const filtered = allParks.filter((p) => matches(p, q, country, regionKey));
  renderList(filtered);
  redrawMap(filtered);
}

async function load() {
  initMap();
  try {
    const res = await fetch("data/parks.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allParks = data.parks ?? [];
    const meta = document.getElementById("meta");
    if (meta && data.generatedAt) {
      meta.textContent = `Dataset from ${data.generatedAt.slice(0, 10)} · ${allParks.length} parks`;
    }
  } catch (e) {
    console.error(e);
    const meta = document.getElementById("meta");
    if (meta) meta.textContent = "Could not load data/parks.json — run node scripts/fetch-parks.mjs";
    return;
  }

  populateCountrySelect();
  populateRegionSelect();
  document.getElementById("q")?.addEventListener("input", () => applyFilters());
  document.getElementById("country")?.addEventListener("change", () => {
    const reg = document.getElementById("province");
    if (reg) reg.value = "";
    populateRegionSelect();
    applyFilters();
  });
  document.getElementById("province")?.addEventListener("change", () => applyFilters());
  initReviewsDialog();
  applyFilters();
}

load();
