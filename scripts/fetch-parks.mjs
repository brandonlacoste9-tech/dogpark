#!/usr/bin/env node
/**
 * Fetches dog parks (OSM leisure=dog_park) across North America (Canada, US, Mexico)
 * via Overpass, using regional bboxes. Dedupes by OSM id.
 *
 * Usage:
 *   node scripts/fetch-parks.mjs
 *   node scripts/fetch-parks.mjs --resume   # continue after a failed run (uses site/data/parks.json + progress file)
 *
 * Data © OpenStreetMap contributors, ODbL.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countryRegionFromLatLon } from "./region-from-coords.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : path.join(path.dirname(SCRIPT_DIR), "site", "data", "parks.json");
const PROGRESS = path.join(SCRIPT_DIR, ".fetch-progress.json");
const RESUME = process.argv.includes("--resume");

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

/** @type {{ id: string, south: number, west: number, north: number, east: number }[]} */
const REGIONS = [
  { id: "ca-bc-yt-west", south: 48.2, west: -139.2, north: 60.2, east: -120.0 },
  { id: "ca-bc-ab", south: 49.0, west: -125.0, north: 60.0, east: -109.5 },
  { id: "ca-prairies", south: 49.0, west: -120.0, north: 60.0, east: -95.0 },
  { id: "ca-ont-mb-east", south: 41.5, west: -102.0, north: 57.0, east: -74.0 },
  { id: "ca-quebec", south: 44.5, west: -79.5, north: 62.8, east: -57.0 },
  { id: "ca-atlantic", south: 43.5, west: -67.5, north: 52.5, east: -52.0 },
  { id: "ca-north", south: 60.0, west: -141.0, north: 83.5, east: -61.0 },
];

for (const [south, north] of [
  [23.0, 32],
  [32, 38],
  [38, 45],
  [45, 50.5],
]) {
  for (const [west, east] of [
    [-125, -115],
    [-115, -100],
    [-100, -85],
    [-85, -66],
  ]) {
    REGIONS.push({
      id: `us-r${south}n${north}w${Math.round(west)}e${Math.round(east)}`,
      south,
      west,
      north,
      east,
    });
  }
}

// Alaska split: single bbox times out on public Overpass; four tiles cover the state.
REGIONS.push(
  { id: "us-ak-sw", south: 51.0, west: -179.0, north: 60.5, east: -154.0 },
  { id: "us-ak-nw", south: 60.5, west: -179.0, north: 71.5, east: -154.0 },
  { id: "us-ak-se", south: 51.0, west: -154.0, north: 60.5, east: -129.0 },
  { id: "us-ak-ne", south: 60.5, west: -154.0, north: 71.5, east: -129.0 },
  { id: "us-hi", south: 18.5, west: -161.0, north: 22.5, east: -154.0 },
  { id: "us-pr", south: 17.85, west: -67.95, north: 18.55, east: -65.2 },
  { id: "mx-sw", south: 14.5, west: -118.0, north: 22.5, east: -100.0 },
  { id: "mx-se", south: 14.5, west: -100.0, north: 22.5, east: -86.0 },
  { id: "mx-nw", south: 22.5, west: -118.0, north: 33.3, east: -105.0 },
  { id: "mx-ne", south: 22.5, west: -105.0, north: 33.3, east: -86.0 },
);

const TEMPLATE = `[out:json][timeout:240];
(
  node["leisure"="dog_park"]({{bbox}});
  way["leisure"="dog_park"]({{bbox}});
);
out center;`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sortedParks(merged) {
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function writeOutput(merged, checkpoint) {
  const parks = sortedParks(merged);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: parks.length,
        ...(checkpoint ? { fetchCheckpoint: true } : {}),
        parks,
      },
      null,
      2,
    ),
    "utf8",
  );
}

async function fetchRegion(bbox, endpoint, attempt = 1) {
  let body = TEMPLATE.replaceAll("{{bbox}}", `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`);
  body = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(body)}`,
  });
  const text = await res.text();
  const busy =
    res.status === 504 ||
    res.status === 429 ||
    /too busy|timeout/i.test(text);
  if (busy && attempt < 4) {
    await sleep(5000 * attempt);
    return fetchRegion(bbox, endpoint, attempt + 1);
  }
  if (!res.ok) throw new Error(`${endpoint} HTTP ${res.status}: ${text.slice(0, 200)}`);
  if (text.trimStart().startsWith("<")) throw new Error(`Non-JSON: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

/** First non-empty string among tag keys, or null. */
function strTag(tags, ...keys) {
  for (const k of keys) {
    const v = tags[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

/** First http(s) URL from OSM tags, or null. */
function websiteFromTags(tags) {
  const raw =
    tags.website ?? tags["contact:website"] ?? tags.url ?? tags["operator:website"] ?? null;
  if (raw == null || raw === "") return null;
  let s = String(raw).trim().split(/[;\n]/)[0]?.trim() ?? "";
  if (!s) return null;
  s = s.replace(/\s+/g, "");
  if (s.startsWith("//")) s = "https:" + s;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  try {
    const u = new URL(s);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function mergeElements(json, byKey) {
  for (const el of json.elements ?? []) {
    if (el.type !== "node" && el.type !== "way") continue;
    let lat = el.lat;
    let lon = el.lon;
    if (el.center) {
      lat = el.center.lat;
      lon = el.center.lon;
    }
    if (lat == null || lon == null) continue;
    const tags = el.tags ?? {};
    const primary = tags.name ?? tags["name:en"] ?? "Dog park";
    const nameEn = strTag(tags, "name:en");
    const key = `${el.type}/${el.id}`;
    if (byKey.has(key)) continue;
    const { country, region } = countryRegionFromLatLon(lat, lon);
    byKey.set(key, {
      id: key,
      osmType: el.type,
      osmId: el.id,
      name: String(primary).trim() || "Dog park",
      nameEn: nameEn && nameEn !== String(primary).trim() ? nameEn : null,
      lat,
      lon,
      country,
      province: region,
      city: strTag(tags, "addr:city", "addr:hamlet", "addr:town", "addr:village"),
      website: websiteFromTags(tags),
      openingHours: strTag(tags, "opening_hours"),
      fee: strTag(tags, "fee"),
      access: strTag(tags, "access"),
      surface: strTag(tags, "surface"),
      lit: strTag(tags, "lit"),
      fence: strTag(tags, "fence", "fenced"),
      dog: strTag(tags, "dog"),
      wheelchair: strTag(tags, "wheelchair"),
      operator: strTag(tags, "operator"),
    });
  }
}

async function main() {
  const merged = new Map();
  /** @type {Set<string>} */
  let completed = new Set();

  if (RESUME) {
    if (fs.existsSync(OUT)) {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      for (const p of prev.parks ?? []) merged.set(p.id, p);
    }
    try {
      const prog = JSON.parse(fs.readFileSync(PROGRESS, "utf8"));
      completed = new Set(prog.completed ?? []);
    } catch {
      /* no progress file */
    }
    console.error(`Resume: ${merged.size} parks in file, skipping ${completed.size} regions`);
  } else {
    if (fs.existsSync(PROGRESS)) fs.unlinkSync(PROGRESS);
  }

  for (let i = 0; i < REGIONS.length; i++) {
    const r = REGIONS[i];
    if (completed.has(r.id)) {
      console.error(`Skip ${r.id} (already completed)`);
      continue;
    }

    const bbox = { south: r.south, west: r.west, north: r.north, east: r.east };
    let lastErr = null;
    for (const ep of ENDPOINTS) {
      try {
        console.error(`Fetching ${r.id} via ${ep}…`);
        const json = await fetchRegion(bbox, ep);
        mergeElements(json, merged);
        console.error(`  → ${merged.size} parks total`);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error(`  ! ${e.message}`);
      }
    }
    if (lastErr) throw lastErr;

    completed.add(r.id);
    writeOutput(merged, true);
    fs.writeFileSync(
      PROGRESS,
      JSON.stringify({ completed: [...completed], updatedAt: new Date().toISOString() }, null, 0),
      "utf8",
    );

    if (i < REGIONS.length - 1) await sleep(4000);
  }

  const parks = sortedParks(merged);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: parks.length, parks }, null, 2),
    "utf8",
  );
  if (fs.existsSync(PROGRESS)) fs.unlinkSync(PROGRESS);
  console.error(`Wrote ${parks.length} parks → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  console.error(`Partial data may be in ${OUT}; re-run with --resume to continue.`);
  process.exit(1);
});
