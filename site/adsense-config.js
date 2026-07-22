/**
 * Google AdSense config for Dogpark (static site).
 *
 * 1. Confirm site is Ready in AdSense → Sites
 * 2. Enable Auto ads (works with the loader script alone)
 * 3. Optional: create Display units and paste slot IDs below
 * 4. Keep ads.txt in sync (pub- id = client without "ca-")
 */
export const ADSENSE_PUBLISHER_ID = "ca-pub-4276130467303652";

export const ADSENSE_ENABLED = true;

/**
 * Display unit slot IDs from AdSense → Ads → By ad unit → Get code.
 * Leave empty to skip manual units (Auto ads can still fill).
 */
export const ADSENSE_SLOTS = {
  /** Banner between filters and map/list */
  display: "",
  /** Banner above footer */
  footer: "",
};

export function adsTxtLine() {
  const pub = ADSENSE_PUBLISHER_ID.replace(/^ca-/, "");
  return `google.com, ${pub}, DIRECT, f08c47fec0942fa0`;
}
