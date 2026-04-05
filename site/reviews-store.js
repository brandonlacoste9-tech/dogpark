/**
 * Browser-only review storage for static hosting: reads/writes localStorage.
 * No network calls; data never leaves the visitor's device unless they clear site data.
 */
const STORAGE_KEY = "dogpark-reviews-v1";

/**
 * @typedef {{ id: string, rating: number, text: string, author: string, createdAt: string }} Review
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

/**
 * @param {string} parkId
 * @param {{ rating: number, text: string, author: string }} input
 */
export function addReview(parkId, input) {
  const rating = Math.min(5, Math.max(1, Math.round(Number(input.rating))));
  const text = String(input.text ?? "").trim().slice(0, 2000);
  if (!text) throw new Error("Please write a short review.");

  const author = String(input.author ?? "").trim().slice(0, 80) || "Anonymous";
  const all = loadAll();
  if (!all[parkId]) all[parkId] = [];

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  all[parkId].push({
    id,
    rating,
    text,
    author,
    createdAt: new Date().toISOString(),
  });
  saveAll(all);
}
