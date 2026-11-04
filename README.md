# Kitchen Board

A wall display for the family kitchen. It is a single page (`index.html`, plus an optional `sw.js` for offline start-up). It shows:

| Panel     | Source                                               |
|-----------|------------------------------------------------------|
| Calendar  | Google Calendar API (one or more calendars)          |
| Shopping  | A Todoist project. Its sections become aisle headings. |
| Meals     | A Todoist project. A task's due date is the day of that meal. |
| Reminders | Any Todoist filter (default: `#Reminders` items due soon). |

Tap an item to tick it off. You have 4 seconds to tap again and undo. You can also add shopping items from the box under the list.

## Hosting
Put both files on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages). Set that URL as the Fully Kiosk **Start URL**.
On HTTPS the service worker caches the page itself. The board still loads if the tablet reboots while the internet is down.

## Setup (on the tablet)
Hold your finger on the clock for 2 seconds to open the settings, or open the page with `?settings` on the end of the address.
Until you set something up, the board shows sample data.

**Todoist:** Settings → Integrations → Developer → copy the API token. Create projects named `Shopping`, `Meals` and `Reminders`, or change the names in settings.

**Google Calendar:** pick one of two ways.
- *API key* (simplest). This only works for calendars shared publicly. In Google Cloud Console, turn on the Calendar API and create an API key. Restrict the key to the Calendar API and to your site's address.
- *Google sign-in* (for private calendars). Create an OAuth client of type **"TVs and Limited Input devices"**. Enter its client ID and secret, then tap **Connect Google**. Approve the code on your phone, then tap **List my calendars**.
  **Important:** set the OAuth consent screen's publishing status to **In production**, not "Testing". In "Testing" mode, Google expires the sign-in after 7 days.

Use **Backup & diagnostics** in settings to export the settings as JSON. The same panel shows the recent error log.

## How it keeps running on its own
- Every dataset is cached on the tablet. When a fetch fails, the board keeps showing the last good data, and the status bar says how old it is.
- After a failure it retries with backoff (30 s → 1 min → 2 min … up to the normal refresh interval). It refreshes straight away when the network comes back or the screen wakes.
- Ticks and additions made while offline go into a queue and survive reboots. They sync to Todoist when the connection returns.
- A watchdog restarts refreshes that stall. The page also reloads itself once a day (03:30 by default) to clear memory, but only if the page can be fetched.
- Night mode dims the display. If you're running Fully Kiosk, it also lowers the screen brightness. The first touch at night only wakes the screen; it never ticks anything off.
- Every 10 minutes the layout shifts a few pixels to prevent screen burn-in.

## Recommended Fully Kiosk settings
- Web Content → Start URL: your hosted URL
- Advanced Web Settings → **Enable JavaScript Interface** (for brightness control)
- Device Management → **Keep Screen On**. Turn on **Launch on Boot** too.
- Web Auto Reload → **Reload on Network Reconnect** (optional; the page also handles this itself)
- Device Management → **Remote Admin** (optional, for managing the tablet from your phone)
