import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { boxes } = JSON.parse(readFileSync(path.join(__dirname, "north-america-regions.json"), "utf8"));

/**
 * First matching axis-aligned box wins. Boxes are ordered for Canada/US/Mexico border cases
 * (HI/AK first, then Canadian provinces, then US, then Mexico). Residual mis-tags are possible
 * on complex borders and Point Roberts–style enclaves.
 *
 * @returns {{ country: "CA"|"US"|"MX"|null, region: string|null }}
 */
export function countryRegionFromLatLon(lat, lon) {
  for (const row of boxes) {
    const [country, region, s, w, n, e] = row;
    if (lat >= s && lat <= n && lon >= w && lon <= e)
      return { country: /** @type {"CA"|"US"|"MX"} */ (country), region };
  }
  return { country: null, region: null };
}

/** @deprecated use countryRegionFromLatLon — kept for one-off scripts */
export function provinceFromLatLon(lat, lon) {
  const { country, region } = countryRegionFromLatLon(lat, lon);
  return country === "CA" ? region : null;
}
