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

## Who's who in the calendar
If the family shares one Google calendar, give each person's events their own colour in Google Calendar. On the board, open Settings → **Who's who (event colours)** and type each person's name next to their colour. Every event then shows a coloured name tag, and the top of the calendar panel shows a key. Events with no colour of their own (they show in their calendar's colour in Google, e.g. Cherry blossom) all use the name and colour set in "No colour chosen". If you use a separate calendar per person, the board uses each calendar's name instead.

The calendar lists the next 30 days (change this in Settings → Days to show, up to 31). Empty days after tomorrow are skipped. Swipe the panel to scroll; after 2 minutes untouched, every list scrolls back to the top.

## Photo screen saver
When nobody has touched the screen for 5 minutes, the board shows a slideshow of family photos. A strip along the bottom shows the time, what's on next, tonight's dinner and anything due today. One tap brings the board back, and that tap never ticks anything off. The slideshow stays off during night mode.

Photos come from a Google Drive folder called **Kitchen Board Photos**. The Google helper (`google-apps-script.js`) creates that folder the first time the board asks for photos. Anyone the folder is shared with can add pictures from their phone. The tablet keeps its own copy of each photo, so the slideshow still works offline. When a photo is removed from the folder, it disappears from the board too.

If a photo shows the wrong way round, tap the ↻ button in the top-right corner of the slideshow: each tap turns it a quarter turn, and the board remembers it for that photo. Photos are also turned upright automatically when the phone saved a "which way up" note with them.

To change how long before it starts, or how long each photo shows, go to Settings → Photo screen saver. Set "Start after" to 0 to turn the slideshow off.

## Seasonal decorations
Animated decorations appear by themselves at certain times of year:

| When | Decoration |
|---|---|
| 24–31 October | Halloween: bats and ghosts, pumpkins by the date |
| 5 November | Bonfire Night: fireworks |
| November (other days) | Falling autumn leaves |
| December | Snow, twinkling lights along the top, Christmas tree |
| Palm Sunday to Easter Monday | Easter eggs, chicks and tulips (the dates are worked out for each year) |
| 14 February | Valentine's hearts |
| Mothering Sunday (UK, calculated each year) | Flowers and a "Happy Mother's Day!" banner |
| Third Sunday in June | Stars and trophies and a "Happy Father's Day!" banner |
| 5 May (anniversaries list) | Rings, hearts and a "Happy anniversary!" banner |
| 22 July – 3 September (changeable) | Summer holidays: butterflies and kites, sun and beach by the date |
| 31 December | New Year's Eve fireworks |
| Birthdays (9 Jan, 20 Feb, 25 Aug) | Coloured balloons and a "Happy birthday!" banner |

Taps go straight through the decorations, and they switch off at night. In Settings → Seasonal decorations you can turn them off, edit the birthday and anniversary lists (`day/month | Name`, one per line; adding a name personalises the banner), change the summer holiday dates, or preview any decoration for a minute.

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
