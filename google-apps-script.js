/**
 * Kitchen Board helper (calendar + photos).
 *
 * Paste this into a project at https://script.google.com while signed in to the
 * Google account that holds the family calendars, then deploy it as a web app:
 * Execute as "Me", Who has access "Anyone".
 *
 * - Calendar: READ-ONLY. Returns the next week or so of events from every calendar
 *   in your Google Calendar list.
 * - Photos: shows pictures from a Google Drive folder called "Kitchen Board Photos"
 *   (created automatically the first time). Only files inside that folder are served.
 *
 * The web app address is the only key, so keep it private. If it ever leaks, use
 * Deploy > Manage deployments > Archive, then make a new deployment and update the board.
 */
var PHOTO_FOLDER = 'Kitchen Board Photos';
var PHOTO_SIZE = 1600;   // longest side, in pixels, of the copies sent to the tablet

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.photos === 'list') return json_({ photos: listPhotos_() });
    if (p.photo) return json_(getPhoto_(String(p.photo)));
    return json_(calendars_(p));
  } catch (err) {
    return json_({ error: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- calendar ---------- */
function calendars_(p) {
  var days = Math.min(31, Math.max(1, Number(p.days) || 7));
  var tz = Session.getScriptTimeZone();
  var from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - 1);
  var to = new Date(from.getTime()); to.setDate(to.getDate() + days + 2);
  var day = function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); };

  var calendars = CalendarApp.getAllCalendars().filter(function (c) { return !c.isHidden(); }).map(function (c) {
    var events = [];
    try {
      events = c.getEvents(from, to).map(function (ev) {
        var allDay = ev.isAllDayEvent();
        return {
          title: ev.getTitle() || '(busy)',
          allDay: allDay,
          start: allDay ? day(ev.getAllDayStartDate()) : ev.getStartTime().toISOString(),
          end: allDay ? day(ev.getAllDayEndDate()) : ev.getEndTime().toISOString(),
          location: ev.getLocation() || '',
          color: ev.getColor() || ''
        };
      });
    } catch (err) { /* one unreadable calendar shouldn't break the rest */ }
    return { id: c.getId(), name: c.getName(), color: c.getColor(), events: events };
  });
  return { calendars: calendars };
}

/* ---------- photos ---------- */
function photoFolder_() {
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
}

function listPhotos_() {
  var out = [], files = photoFolder_().getFiles();
  while (files.hasNext() && out.length < 500) {
    var f = files.next();
    if (String(f.getMimeType()).indexOf('image/') === 0) out.push({ id: f.getId(), updated: f.getLastUpdated().getTime() });
  }
  return out;
}

function getPhoto_(id) {
  var folderId = photoFolder_().getId();
  var f = DriveApp.getFileById(id);
  var inFolder = false, parents = f.getParents();
  while (parents.hasNext()) if (parents.next().getId() === folderId) inFolder = true;
  if (!inFolder) return { error: 'not in the photo folder' };

  // Ask Drive for a resized JPEG (also converts iPhone HEIC photos).
  var blob = null;
  try {
    var auth = { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true };
    var meta = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?fields=thumbnailLink', auth);
    var link = meta.getResponseCode() === 200 ? JSON.parse(meta.getContentText()).thumbnailLink : null;
    if (link) {
      link = /=s\d+$/.test(link) ? link.replace(/=s\d+$/, '=s' + PHOTO_SIZE) : link + '=s' + PHOTO_SIZE;
      var r = UrlFetchApp.fetch(link, auth);
      if (r.getResponseCode() === 200) blob = r.getBlob();
    }
  } catch (err) { /* fall back to the original file below */ }

  if (!blob) {
    if (f.getSize() > 6 * 1024 * 1024) return { error: 'photo too large and no preview available' };
    blob = f.getBlob();
  }
  return { mime: blob.getContentType() || 'image/jpeg', data: Utilities.base64Encode(blob.getBytes()) };
}
