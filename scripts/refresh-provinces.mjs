import fs from "node:fs";
import path from "node:path";
import { countryRegionFromLatLon } from "./region-from-coords.mjs";

const file = path.join(path.dirname(import.meta.dirname), "site", "data", "parks.json");
const raw = fs.readFileSync(file, "utf8");
const data = JSON.parse(raw);
for (const p of data.parks) {
  const { country, region } = countryRegionFromLatLon(p.lat, p.lon);
  p.country = country;
  p.province = region;
}
fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
console.error(`Updated country/region for ${data.parks.length} parks → ${file}`);
