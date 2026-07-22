/**
 * Manual AdSense units for the static Dogpark site.
 * Renders only when ADSENSE_SLOTS has numeric slot IDs.
 * Auto ads (AdSense console) do not need this file.
 */
import {
  ADSENSE_ENABLED,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOTS,
} from "./adsense-config.js";

/**
 * @param {HTMLElement} container
 * @param {string} slot
 * @param {string} [format]
 */
function mountUnit(container, slot, format = "auto") {
  if (!/^\d+$/.test(slot)) return;

  container.hidden = false;
  container.classList.add("ad-unit--active");

  const ins = document.createElement("ins");
  ins.className = "adsbygoogle";
  ins.style.display = "block";
  ins.style.minHeight = "90px";
  ins.setAttribute("data-ad-client", ADSENSE_PUBLISHER_ID);
  ins.setAttribute("data-ad-slot", slot);
  ins.setAttribute("data-ad-format", format);
  ins.setAttribute("data-full-width-responsive", "true");

  const host = container.querySelector(".ad-unit__slot") || container;
  host.appendChild(ins);

  try {
    // @ts-expect-error adsbygoogle global
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* ad blockers */
  }
}

export function initAdSenseUnits() {
  if (!ADSENSE_ENABLED) return;

  const display = document.getElementById("ad-display");
  const footer = document.getElementById("ad-footer");

  if (display && ADSENSE_SLOTS.display) {
    mountUnit(display, ADSENSE_SLOTS.display, "horizontal");
  }
  if (footer && ADSENSE_SLOTS.footer) {
    mountUnit(footer, ADSENSE_SLOTS.footer, "horizontal");
  }
}
