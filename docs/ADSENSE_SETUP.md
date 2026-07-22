# Google AdSense — Dogpark (static)

Static HTML site under `site/`. Same publisher as Vrai Québec / PickleballQC: `ca-pub-4276130467303652`.

## What’s wired

| Piece | Location |
|-------|----------|
| Loader script + account meta | `site/index.html`, `site/privacy.html` |
| `ads.txt` | `site/ads.txt` → served at `/ads.txt` via **rewrite** (not redirect) |
| Config / slots | `site/adsense-config.js` |
| Manual unit mounter | `site/adsense.js` (called from `app.js`) |
| Privacy policy | `site/privacy.html` (`/privacy`) |
| Footer link | Privacy + “Ads by Google” (i18n en/fr/es) |

Manual units stay **hidden** until you paste numeric slot IDs into `ADSENSE_SLOTS` in `adsense-config.js`.

**Auto ads** still work from the AdSense console with only the script on the page.

---

## Checklist

1. AdSense → **Sites** → add the exact production domain.
2. Wait for **Ready**.
3. Enable **Auto ads** for the site.
4. Confirm `https://YOUR_DOMAIN/ads.txt` returns HTTP **200** with:

   ```text
   google.com, pub-4276130467303652, DIRECT, f08c47fec0942fa0
   ```

5. Optional: create Display units → put slot numbers in `site/adsense-config.js` → redeploy.

---

## ads.txt note

Root `vercel.json` uses a **rewrite** so crawlers get a clean 200 at `/ads.txt` instead of a redirect to `/site/ads.txt`.
