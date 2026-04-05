/**
 * Browser-only review storage for static hosting: reads/writes localStorage.
 * No network calls; data never leaves the visitor's device unless they clear site data.
 */
import { t } from "./i18n.js";

const STORAGE_KEY = "dogpark-reviews-v1";

/**
 * @typedef {{ id: string, rating: number, text: string, author: string, createdAt: string, photoUrl?: string | null }} Review
 */

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return typeof o === "object" && o !== null && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

function saveAll(/** @type {Record<string, Review[]>} */ data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} parkId */
export function getReviewsForPark(parkId) {
  const all = loadAll();
  const list = all[parkId];
  if (!Array.isArray(list)) return [];
  return list.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** @param {string} parkId */
export function getReviewSummary(parkId) {
  const list = getReviewsForPark(parkId);
  if (list.length === 0) return null;
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { avg, count: list.length };
}

/** @param {unknown} url */
function safePhotoUrl(url) {
  if (url == null || url === "") return null;
  const s = String(url).trim().slice(0, 2000);
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * @param {string} parkId
 * @param {{ rating: number, text: string, author: string, photoUrl?: string | null }} input
 */
export function addReview(parkId, input) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating))));
  const text = String(input.text ?? "").trim().slice(0, 2000);
  if (!text) throw new Error(t("reviewEmpty"));

  const author = String(input.author ?? "").trim().slice(0, 80) || "Anonymous";
  const photoUrl = safePhotoUrl(input.photoUrl) ?? null;
  const all = loadAll();
  if (!all[parkId]) all[parkId] = [];

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  /** @type {Review} */
  const row = {
    id,
    rating,
    text,
    author,
    createdAt: new Date().toISOString(),
  };
  if (photoUrl) row.photoUrl = photoUrl;
  all[parkId].push(row);
  saveAll(all);
}

/** @returns {string} JSON for download / backup */
export function exportReviewsJson() {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), reviews: loadAll() },
    null,
    2,
  );
}

/**
 * @param {string} jsonText
 * @param {{ mode: "merge" | "replace" }} opts
 * @returns {{ imported: number, parks: number }}
 */
export function importReviewsJson(jsonText, opts) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const incoming = data?.reviews;
  if (typeof incoming !== "object" || incoming === null || Array.isArray(incoming)) {
    throw new Error("Missing a reviews object.");
  }
  let count = 0;
  let parks = 0;
  const next = opts.mode === "replace" ? {} : loadAll();
  for (const [parkId, list] of Object.entries(incoming)) {
    if (typeof parkId !== "string" || !Array.isArray(list)) continue;
    parks++;
    const cleaned = [];
    for (const r of list) {
      if (!r || typeof r !== "object") continue;
      const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating)) || 1));
      const text = String(r.text ?? "").trim().slice(0, 2000);
      if (!text) continue;
      const author = String(r.author ?? "").trim().slice(0, 80) || "Anonymous";
      const createdAt =
        typeof r.createdAt === "string" && r.createdAt ? r.createdAt : new Date().toISOString();
      const photoUrl = safePhotoUrl(r.photoUrl);
      /** @type {Review} */
      const row = {
        id: typeof r.id === "string" && r.id ? r.id : `imp-${Date.now()}-${count}`,
        rating,
        text,
        author,
        createdAt,
      };
      if (photoUrl) row.photoUrl = photoUrl;
      cleaned.push(row);
      count++;
    }
    if (opts.mode === "merge") {
      const prev = next[parkId] ?? [];
      next[parkId] = prev.concat(cleaned);
    } else {
      next[parkId] = cleaned;
    }
  }
  saveAll(next);
  return { imported: count, parks };
}
