import {
  applyDomI18n,
  getLocale,
  htmlLang,
  initLocaleToolbar,
  syncThemeLabels,
  t,
} from "./i18n.js";
import { COUNTRY_LABELS, countryLabel, regionLabel } from "./region-labels.js";
import {
  addReview,
  exportReviewsJson,
  getReviewSummary,
  getReviewsForPark,
  importReviewsJson,
} from "./reviews-store.js";
import { initThemeSegment, isDarkTheme, syncThemeSegmentButtons } from "./theme.js";

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   lat: number,
 *   lon: number,
 *   country: string | null,
 *   province: string | null,
 *   city?: string | null,
 *   website?: string | null,
 *   nameEn?: string | null,
 *   openingHours?: string | null,
 *   fee?: string | null,
 *   access?: string | null,
 *   surface?: string | null,
 *   lit?: string | null,
 *   fence?: string | null,
 *   dog?: string | null,
 *   wheelchair?: string | null,
 *   operator?: string | null,
 * }} Park
 */

/** @type {Park[]} */
let allParks = [];
/** @type {string | null} */
let datasetGeneratedAt = null;
/** @type {{ lat: number, lon: number } | null} */
let userLocation = null;
/** @type {string | null} */
let lastFocusedParkId = null;
/** @type {string | null} */
let initialUrlParkId = null;
/** @type {boolean} */
let initialUrlParkApplied = false;

/** @type {import("leaflet").Map | null} */
let map = null;
/** @type {import("leaflet").TileLayer | null} */
let baseTileLayer = null;
/** @type {import("leaflet").LayerGroup | import("leaflet").MarkerClusterGroup | null} */
let markers = null;
/** @type {import("leaflet").CircleMarker | null} */
let activeMarker = null;

/** @type {Park | null} */
let reviewsModalPark = null;

/** @type {ReturnType<typeof setTimeout> | null} */
let urlSyncTimer = null;

/** @type {Park[]} */
let lastFilteredParks = [];

function norm(s) {
  return s.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

/** @param {{ web: boolean, lit: boolean, fenced: boolean, wheelchair: boolean, feeFree: boolean }} x */
function matches(park, q, country, regionKey, x) {
  if (country && park.country !== country) return false;
  if (regionKey) {
    const [c, r] = regionKey.split("|");
    if (park.country !== c || park.province !== r) return false;
  }
  if (x.web && !safeHref(park.website ?? "")) return false;
  if (x.lit && norm(park.lit ?? "") !== "yes") return false;
  if (x.fenced) {
    const f = norm(park.fence ?? "");
    if (f !== "yes" && f !== "true") return false;
  }
  if (x.wheelchair) {
    const w = norm(park.wheelchair ?? "");
    if (w !== "yes" && w !== "limited") return false;
  }
  if (x.feeFree && norm(park.fee ?? "") !== "no") return false;

  if (!q) return true;
  const reg = regionLabel(park.country, park.province);
  const loc = getLocale();
  const ctry = park.country ? countryLabel(park.country, loc) : "";
  const ctryEn = park.country ? COUNTRY_LABELS[park.country] ?? park.country : "";
  const hay = norm(
    [
      park.name,
      park.nameEn,
      park.city,
      park.province,
      park.website,
      reg,
      ctry,
      ctryEn,
      park.openingHours,
      park.fee,
      park.access,
      park.surface,
      park.lit,
      park.fence,
      park.dog,
      park.wheelchair,
      park.operator,
    ]
      .filter(Boolean)
      .join(" "),
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
  const loc = getLocale();
  const bits = [];
  if (p.city) bits.push(p.city);
  const rl = regionLabel(p.country, p.province);
  if (rl) bits.push(rl);
  if (p.country) bits.push(countryLabel(p.country, loc));
  return bits.join(" · ") || t("placeFallback");
}

/** @param {Park} p */
function parkDetailChips(p) {
  /** @type {{ label: string, value: string }[]} */
  const chips = [];
  if (p.openingHours) chips.push({ label: t("chipHours"), value: p.openingHours });
  if (p.fee) chips.push({ label: t("chipFee"), value: p.fee });
  if (p.access) chips.push({ label: t("chipAccess"), value: p.access });
  if (p.surface) chips.push({ label: t("chipSurface"), value: p.surface });
  if (p.lit) chips.push({ label: t("chipLit"), value: p.lit });
  if (p.fence) chips.push({ label: t("chipFence"), value: p.fence });
  if (p.dog) chips.push({ label: t("chipDog"), value: p.dog });
  if (p.wheelchair) chips.push({ label: t("chipWheelchair"), value: p.wheelchair });
  if (p.operator) chips.push({ label: t("chipOperator"), value: p.operator });
  if (p.nameEn) chips.push({ label: t("chipNameEn"), value: p.nameEn });
  return chips;
}

/** @param {Park} p */
function chipsHtml(p) {
  const chips = parkDetailChips(p);
  if (!chips.length) return "";
  const inner = chips
    .map(
      (c) =>
        `<span class="park-chip" title="${escapeHtml(c.label)}"><span class="park-chip__k">${escapeHtml(c.label)}</span> <span class="park-chip__v">${escapeHtml(c.value)}</span></span>`,
    )
    .join("");
  return `<div class="park-chips" role="group" aria-label="${escapeHtml(t("chipsAria"))}">${inner}</div>`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** @param {Park} p */
function distanceKm(p) {
  if (!userLocation) return Number.POSITIVE_INFINITY;
  return haversineKm(userLocation.lat, userLocation.lon, p.lat, p.lon);
}

/** @param {Park[]} filtered */
function sortParksList(filtered) {
  const sort = /** @type {HTMLSelectElement} */ (document.getElementById("sort"))?.value ?? "name-asc";
  const copy = [...filtered];
  if (sort === "name-desc") {
    copy.sort((a, b) => b.name.localeCompare(a.name, "en"));
    return copy;
  }
  if (sort === "dist") {
    if (!userLocation) copy.sort((a, b) => a.name.localeCompare(b.name, "en"));
    else copy.sort((a, b) => distanceKm(a) - distanceKm(b));
    return copy;
  }
  copy.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return copy;
}

function getExtendedFilters() {
  return {
    web: !!/** @type {HTMLInputElement} */ (document.getElementById("filter-website"))?.checked,
    lit: !!/** @type {HTMLInputElement} */ (document.getElementById("filter-lit"))?.checked,
    fenced: !!/** @type {HTMLInputElement} */ (document.getElementById("filter-fenced"))?.checked,
    wheelchair: !!/** @type {HTMLInputElement} */ (document.getElementById("filter-wheelchair"))?.checked,
    feeFree: !!/** @type {HTMLInputElement} */ (document.getElementById("filter-feefree"))?.checked,
  };
}

function scheduleUrlSync() {
  if (urlSyncTimer) clearTimeout(urlSyncTimer);
  urlSyncTimer = setTimeout(() => {
    urlSyncTimer = null;
    syncUrlState();
  }, 340);
}

function syncUrlState() {
  const u = new URL(window.location.href);
  const q = /** @type {HTMLInputElement} */ (document.getElementById("q"))?.value.trim() ?? "";
  if (q) u.searchParams.set("q", q);
  else u.searchParams.delete("q");

  const country = /** @type {HTMLSelectElement} */ (document.getElementById("country"))?.value ?? "";
  if (country) u.searchParams.set("country", country);
  else u.searchParams.delete("country");

  const region = /** @type {HTMLSelectElement} */ (document.getElementById("province"))?.value ?? "";
  if (region) u.searchParams.set("region", region);
  else u.searchParams.delete("region");

  const sort = /** @type {HTMLSelectElement} */ (document.getElementById("sort"))?.value ?? "name-asc";
  if (sort !== "name-asc") u.searchParams.set("sort", sort);
  else u.searchParams.delete("sort");

  const x = getExtendedFilters();
  if (x.web) u.searchParams.set("web", "1");
  else u.searchParams.delete("web");
  if (x.lit) u.searchParams.set("lit", "1");
  else u.searchParams.delete("lit");
  if (x.fenced) u.searchParams.set("fenced", "1");
  else u.searchParams.delete("fenced");
  if (x.wheelchair) u.searchParams.set("wheelchair", "1");
  else u.searchParams.delete("wheelchair");
  if (x.feeFree) u.searchParams.set("fee", "no");
  else u.searchParams.delete("fee");

  if (lastFocusedParkId) u.searchParams.set("park", lastFocusedParkId);
  else u.searchParams.delete("park");

  history.replaceState(null, "", u.toString());
}

function applyUrlToForm() {
  const u = new URL(window.location.href);
  const qEl = /** @type {HTMLInputElement | null} */ (document.getElementById("q"));
  const vq = u.searchParams.get("q");
  if (vq !== null && qEl) qEl.value = vq;

  let c = u.searchParams.get("country");
  const reg = u.searchParams.get("region");
  if (reg && reg.includes("|") && !c) c = reg.split("|")[0] ?? null;
  if (c) {
    const sel = /** @type {HTMLSelectElement | null} */ (document.getElementById("country"));
    if (sel) sel.value = c;
    populateRegionSelect();
  }

  if (reg) {
    const sel = /** @type {HTMLSelectElement | null} */ (document.getElementById("province"));
    if (sel) sel.value = reg;
  }

  const sort = u.searchParams.get("sort");
  const sortEl = /** @type {HTMLSelectElement | null} */ (document.getElementById("sort"));
  if (sort && sortEl && [...sortEl.options].some((o) => o.value === sort)) sortEl.value = sort;

  const setChk = (id, on) => {
    const el = /** @type {HTMLInputElement | null} */ (document.getElementById(id));
    if (el) el.checked = on;
  };
  setChk("filter-website", u.searchParams.get("web") === "1");
  setChk("filter-lit", u.searchParams.get("lit") === "1");
  setChk("filter-fenced", u.searchParams.get("fenced") === "1");
  setChk("filter-wheelchair", u.searchParams.get("wheelchair") === "1");
  setChk("filter-feefree", u.searchParams.get("fee") === "no");

  initialUrlParkId = u.searchParams.get("park");
}

/** @param {Park[]} parks */
function downloadGeoJson(parks) {
  const at = datasetGeneratedAt ?? new Date().toISOString();
  const features = parks.map((p) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [p.lon, p.lat] },
    properties: {
      id: p.id,
      name: p.name,
      country: p.country,
      province: p.province,
      city: p.city ?? null,
      website: p.website ?? null,
      opening_hours: p.openingHours ?? null,
      fee: p.fee ?? null,
      access: p.access ?? null,
      surface: p.surface ?? null,
      lit: p.lit ?? null,
      fence: p.fence ?? null,
      dog: p.dog ?? null,
      wheelchair: p.wheelchair ?? null,
      operator: p.operator ?? null,
    },
  }));
  const geo = {
    type: "FeatureCollection",
    properties: { source: "OpenStreetMap via dogpark", datasetGeneratedAt: at, count: features.length },
    features,
  };
  const blob = new Blob([JSON.stringify(geo, null, 2)], { type: "application/geo+json" });
  const a = document.createElement("a");
  const stub = at.slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `dog-parks-${stub}-${features.length}.geojson`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(new URL("sw.js", import.meta.url)).catch(() => {});
}

/** @returns {{ la: number, lo: number } | null} */
function mapCoords(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  return { la, lo };
}

function mapMarkerColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    color: s.getPropertyValue("--map-marker-stroke").trim() || "#1b4332",
    fillColor: s.getPropertyValue("--map-marker-fill").trim() || "#52b788",
  };
}

function setBaseMapLayer() {
  if (!map || typeof L === "undefined") return;
  if (baseTileLayer) {
    map.removeLayer(baseTileLayer);
    baseTileLayer = null;
  }
  if (isDarkTheme()) {
    baseTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
    });
  } else {
    baseTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
  }
  baseTileLayer.addTo(map);
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
  wrap.setAttribute("aria-label", t("mapsGroupAria"));

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

  wrap.appendChild(
    addLink(t("mapLinkOsm"), `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=15/${la}/${lo}`),
  );
  wrap.appendChild(sep());
  wrap.appendChild(addLink(t("mapLinkGoogle"), `https://www.google.com/maps?q=${la},${lo}`));
  wrap.appendChild(sep());
  wrap.appendChild(addLink(t("mapLinkApple"), `https://maps.apple.com/?ll=${la},${lo}`));
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
    b.setAttribute(
      "aria-label",
      v <= 1 ? t("starAriaOne", { n: v }) : t("starAriaMany", { n: v }),
    );
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
    p.textContent = t("noReviewsYet");
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
    stars.setAttribute("aria-label", t("reviewStarsOutOf", { rating: r.rating }));
    stars.textContent = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const who = document.createElement("span");
    who.className = "review-card__author";
    who.textContent = r.author;
    const when = document.createElement("time");
    when.className = "review-card__time";
    when.dateTime = r.createdAt;
    when.textContent = new Date(r.createdAt).toLocaleDateString(htmlLang(getLocale()), {
      dateStyle: "medium",
    });
    head.appendChild(stars);
    head.appendChild(who);
    head.appendChild(when);
    const body = document.createElement("p");
    body.className = "review-card__text";
    body.textContent = r.text;
    card.appendChild(head);
    card.appendChild(body);
    if (r.photoUrl) {
      const ph = document.createElement("p");
      ph.className = "review-card__photo";
      const a = document.createElement("a");
      a.href = r.photoUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = t("photoLink");
      ph.appendChild(a);
      card.appendChild(ph);
    }
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
    const w = sum.count === 1 ? t("reviewOne") : t("reviewMany");
    meta.textContent = `${sum.avg.toFixed(1)} / 5 · ${sum.count} ${w}`;
    meta.setAttribute(
      "aria-label",
      t("summaryAria", { avg: sum.avg.toFixed(1), count: sum.count }),
    );
  } else {
    meta.textContent = t("noReviewsBrowser");
    meta.classList.add("park-review-line__summary--empty");
  }
  const revBtn = document.createElement("button");
  revBtn.type = "button";
  revBtn.className = "park-review-line__btn";
  revBtn.textContent = sum ? t("reviewSee") : t("reviewWrite");
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
    const photoUrl = /** @type {HTMLInputElement} */ (form.elements.namedItem("photoUrl"))?.value ?? "";
    try {
      addReview(reviewsModalPark.id, { rating, text, author, photoUrl });
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
  html += chipsHtml(p);
  if (web) {
    html += `<a class="park-popup__web" href="${escapeHtml(web)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("popupWebsite"))}</a>`;
  }
  if (c) {
    const osm = `https://www.openstreetmap.org/?mlat=${c.la}&mlon=${c.lo}#map=15/${c.la}/${c.lo}`;
    const g = `https://www.google.com/maps?q=${c.la},${c.lo}`;
    const apple = `https://maps.apple.com/?ll=${c.la},${c.lo}`;
    html += `<div class="park-popup__maps"><a href="${escapeHtml(osm)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("mapLinkOsm"))}</a><span class="park-popup__dot" aria-hidden="true">·</span><a href="${escapeHtml(g)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("mapLinkGoogle"))}</a><span class="park-popup__dot" aria-hidden="true">·</span><a href="${escapeHtml(apple)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("mapLinkApple"))}</a></div>`;
  }
  const sum = getReviewSummary(p.id);
  const revBtnLabel = sum
    ? t("popupReviewsFmt", { count: sum.count, avg: sum.avg.toFixed(1) })
    : t("popupReviewsEmpty");
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
    const chipList = parkDetailChips(p).slice(0, 4);
    if (chipList.length) {
      const row = document.createElement("div");
      row.className = "park-item__chips";
      for (const c of chipList) {
        const sp = document.createElement("span");
        sp.className = "park-chip park-chip--compact";
        sp.title = `${c.label}: ${c.value}`;
        const short =
          c.value.length > 28 ? `${c.value.slice(0, 26).trim()}…` : c.value;
        sp.textContent = short;
        row.appendChild(sp);
      }
      btn.appendChild(row);
    }
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
      a.textContent = t("linkWebsite");
      a.addEventListener("click", (e) => e.stopPropagation());
      web.appendChild(a);
      li.appendChild(web);
    }
    appendMapLinksRow(li, p);
    frag.appendChild(li);
  }
  ul.appendChild(frag);

  const more = filtered.length > 500 ? t("metaMore", { n: filtered.length }) : "";
  const dateBit = datasetGeneratedAt ? `${datasetGeneratedAt.slice(0, 10)} · ` : "";
  const plural = filtered.length === 1 ? "" : "s";
  meta.textContent = t("metaLine", {
    date: dateBit,
    n: filtered.length,
    plural,
    more,
    total: allParks.length,
  });
}

function getListParkButtons() {
  return [...document.querySelectorAll("#list .park-item__main")].filter(
    (n) => n instanceof HTMLButtonElement,
  );
}

/** @returns {number} index of row in buttons, -1 if panel focused / unknown, -2 if outside list rows */
function listFocusButtonIndex(/** @type {HTMLElement | null} */ panel, buttons) {
  if (!panel) return -2;
  const t = document.activeElement;
  if (!(t instanceof HTMLElement)) return -2;
  if (t === panel) return -1;
  if (!panel.contains(t)) return -2;
  if (t.classList.contains("park-item__main")) {
    const i = buttons.indexOf(/** @type {HTMLButtonElement} */ (t));
    return i;
  }
  const li = t.closest(".park-item");
  if (li && panel.contains(li)) {
    const btn = li.querySelector(".park-item__main");
    if (btn instanceof HTMLButtonElement) return buttons.indexOf(btn);
  }
  return -1;
}

function initListKeyboardNav() {
  const panel = document.getElementById("list-panel");
  if (!panel) return;

  panel.addEventListener("keydown", (e) => {
    const dlg = /** @type {HTMLDialogElement | null} */ (document.getElementById("reviews-dialog"));
    if (dlg?.open) return;

    const buttons = getListParkButtons();
    if (!buttons.length) return;

    let idx = listFocusButtonIndex(panel, buttons);
    if (idx === -2) return;

    const moveDown = e.key === "ArrowDown" || e.key === "ArrowRight";
    const moveUp = e.key === "ArrowUp" || e.key === "ArrowLeft";
    const home = e.key === "Home";
    const end = e.key === "End";
    if (!moveDown && !moveUp && !home && !end) return;

    e.preventDefault();
    if (home) idx = 0;
    else if (end) idx = buttons.length - 1;
    else if (moveDown) idx = idx < 0 ? 0 : Math.min(idx + 1, buttons.length - 1);
    else if (moveUp) idx = idx < 0 ? buttons.length - 1 : Math.max(idx - 1, 0);

    const btn = buttons[idx];
    if (!btn) return;
    btn.focus();
    btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    const id = btn.dataset.id;
    const p = lastFilteredParks.find((x) => x.id === id);
    if (p) focusPark(p, btn);
  });
}

/** @param {Park} p @param {HTMLButtonElement | null} btn */
function focusPark(p, btn) {
  if (!map || !markers) return;
  lastFocusedParkId = p.id;
  scheduleUrlSync();
  map.setView([p.lat, p.lon], Math.max(map.getZoom(), 14), { animate: true });
  document.querySelectorAll(".park-item__main.active").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (activeMarker) {
    activeMarker.setStyle?.({ opacity: 1, fillOpacity: 0.85 });
    activeMarker = null;
  }
  markers.eachLayer((layer) => {
    const id = /** @type {{ parkId?: string }} } */ (layer).parkId;
    if (id === p.id) {
      const l = /** @type {import("leaflet").CircleMarker} */ (layer);
      activeMarker = l;
      l.setStyle?.({ opacity: 0.92, fillOpacity: 0.65 });
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

function refreshCountryOptionLabels() {
  const sel = document.getElementById("country");
  if (!sel) return;
  const loc = getLocale();
  for (const opt of sel.options) {
    if (!opt.value) opt.textContent = t("countryAll");
    else opt.textContent = countryLabel(opt.value, loc);
  }
}

function populateCountrySelect() {
  const sel = document.getElementById("country");
  if (!sel) return;
  const codes = [...new Set(allParks.map((p) => p.country).filter(Boolean))].sort(countrySort);
  const loc = getLocale();
  for (const c of codes) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = countryLabel(c, loc);
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
  const coll = new Intl.Collator(htmlLang(getLocale()), { sensitivity: "base" });

  const all = document.createElement("option");
  all.value = "";
  all.textContent = t("regionAll");
  regSel.appendChild(all);

  const keys = new Set();
  for (const p of allParks) {
    const k = regionOptionKey(p);
    if (!k) continue;
    if (countryFilter && p.country !== countryFilter) continue;
    keys.add(k);
  }

  const loc = getLocale();
  const sorted = [...keys].sort((a, b) => {
    const [ca, ra] = a.split("|");
    const [cb, rb] = b.split("|");
    const la = `${countryLabel(ca, loc)} ${regionLabel(ca, ra)}`;
    const lb = `${countryLabel(cb, loc)} ${regionLabel(cb, rb)}`;
    return coll.compare(la, lb);
  });

  for (const k of sorted) {
    const [c, r] = k.split("|");
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${countryLabel(c, loc)} · ${regionLabel(c, r)}`;
    regSel.appendChild(opt);
  }
}

function initMap() {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;

  map = L.map(el, { scrollWheelZoom: true }).setView([45, -100], 3);
  setBaseMapLayer();

  markers =
    typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup({
          maxClusterRadius: 56,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
        }).addTo(map)
      : L.layerGroup().addTo(map);
}

function redrawMap(filtered) {
  if (!map || !markers) return;
  markers.clearLayers();

  const mc = mapMarkerColors();
  const chunk = filtered.slice(0, 3500);
  for (const p of chunk) {
    const m = L.circleMarker([p.lat, p.lon], {
      radius: 6,
      weight: 2,
      color: mc.color,
      fillColor: mc.fillColor,
      fillOpacity: 0.85,
    });
    /** @type {*} */ (m).parkId = p.id;
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
  const x = getExtendedFilters();
  let filtered = allParks.filter((p) => matches(p, q, country, regionKey, x));
  if (lastFocusedParkId && !filtered.some((p) => p.id === lastFocusedParkId)) lastFocusedParkId = null;
  const filteredSorted = sortParksList(filtered);
  lastFilteredParks = filteredSorted;
  renderList(filteredSorted);
  redrawMap(filteredSorted);
  scheduleUrlSync();
  if (!initialUrlParkApplied) {
    if (initialUrlParkId) {
      const p = allParks.find((px) => px.id === initialUrlParkId);
      if (p && filteredSorted.some((px) => px.id === p.id)) {
        requestAnimationFrame(() => {
          const btn = document.querySelector(`.park-item__main[data-id="${CSS.escape(p.id)}"]`);
          focusPark(p, /** @type {HTMLButtonElement} */ (btn));
        });
      }
    }
    initialUrlParkApplied = true;
  }
}

function onLocaleOrThemeLabelsChange() {
  applyDomI18n();
  syncThemeLabels();
  syncThemeSegmentButtons();
  refreshCountryOptionLabels();
  populateRegionSelect();
  initStarInput();
  if (reviewsModalPark) renderDialogReviewList(reviewsModalPark.id);
  applyFilters();
}

function initReviewsBackup() {
  document.getElementById("reviews-export")?.addEventListener("click", () => {
    const blob = new Blob([exportReviewsJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dogpark-reviews-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const file = /** @type {HTMLInputElement | null} */ (document.getElementById("reviews-import-file"));
  document.getElementById("reviews-import-trigger")?.addEventListener("click", () => file?.click());
  file?.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    const text = await f.text();
    file.value = "";
    const merge = window.confirm(t("importMergeTitle"));
    try {
      const r = importReviewsJson(text, { mode: merge ? "merge" : "replace" });
      window.alert(t("importSuccess", { count: r.imported, parks: r.parks }));
      applyFilters();
      if (reviewsModalPark) renderDialogReviewList(reviewsModalPark.id);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("importFail"));
    }
  });
}

async function load() {
  applyDomI18n();
  syncThemeLabels();
  syncThemeSegmentButtons();

  initMap();
  try {
    const res = await fetch("data/parks.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allParks = data.parks ?? [];
    datasetGeneratedAt = typeof data.generatedAt === "string" ? data.generatedAt : null;
    const hint = document.getElementById("data-hint");
    if (hint) hint.textContent = datasetGeneratedAt ? t("dataHintStatic") : "";
  } catch (e) {
    console.error(e);
    const meta = document.getElementById("meta");
    if (meta) meta.textContent = t("loadError");
    return;
  }

  populateCountrySelect();
  populateRegionSelect();
  applyUrlToForm();

  document.getElementById("q")?.addEventListener("input", () => applyFilters());
  document.getElementById("country")?.addEventListener("change", () => {
    const reg = document.getElementById("province");
    if (reg) reg.value = "";
    populateRegionSelect();
    applyFilters();
  });
  document.getElementById("province")?.addEventListener("change", () => applyFilters());
  document.getElementById("sort")?.addEventListener("change", () => applyFilters());
  for (const id of ["filter-website", "filter-lit", "filter-fenced", "filter-wheelchair", "filter-feefree"]) {
    document.getElementById(id)?.addEventListener("change", () => applyFilters());
  }

  document.getElementById("btn-near-me")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      window.alert(t("geoNoBrowser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const sortEl = /** @type {HTMLSelectElement | null} */ (document.getElementById("sort"));
        if (sortEl) sortEl.value = "dist";
        applyFilters();
        if (map) map.setView([userLocation.lat, userLocation.lon], Math.max(map.getZoom(), 10));
      },
      () => window.alert(t("geoDenied")),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  });

  document.getElementById("btn-geojson")?.addEventListener("click", () => {
    const n = lastFilteredParks.length;
    if (n === 0) {
      window.alert(t("geojsonEmpty"));
      return;
    }
    const cap = 8000;
    const slice = n > cap ? lastFilteredParks.slice(0, cap) : lastFilteredParks;
    if (n > cap) window.alert(t("geojsonCap", { cap, n }));
    downloadGeoJson(slice);
  });

  initReviewsDialog();
  initReviewsBackup();
  initListKeyboardNav();
  initLocaleToolbar(onLocaleOrThemeLabelsChange);
  registerServiceWorker();
  initThemeSegment(() => {
    setBaseMapLayer();
    applyFilters();
  });
  applyFilters();
}

load();
