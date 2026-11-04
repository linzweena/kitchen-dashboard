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

**Google Calendar (recommended way): a small helper in your own Google account**
1. On a computer, go to https://script.google.com, signed in to the Google account that has the family calendars. Click **New project**.
2. Delete what's in the editor. Paste in everything from `google-apps-script.js` in this folder, then click the save icon.
3. Click **Deploy**, then **New deployment**. Click the cog next to "Select type" and choose **Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**.
4. Click **Authorize access** and choose your account. If Google says it "hasn't verified this app", click **Advanced**, then **Go to … (unsafe)**. That warning appears because the app is yours rather than a published one. Then click **Allow**.
5. Copy the **Web app URL**, which ends in `/exec`. Keep it private, because anyone with it can see your calendar.
6. On the board, open the settings. Leave Access on **Apps Script…**, paste the address in, and tap **List my calendars**. Delete any calendars you don't want, then tap **Save & restart**.

The helper only reads calendars, never changes them, and it doesn't expire. If the address ever leaks, go to Deploy → Manage deployments, archive the old one and make a new one.

The two other options (API key, and Google sign-in) are kept for advanced use. The API key only works for calendars shared publicly. Google sign-in requires an OAuth client in Google Cloud Console, and Google may not allow calendar access through that sign-in method.

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
