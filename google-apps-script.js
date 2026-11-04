/**
 * Kitchen Board calendar helper.
 *
 * Paste this into a new project at https://script.google.com while signed in to
 * the Google account that holds (or can see) the family calendars, then deploy it
 * as a web app: Execute as "Me", Who has access "Anyone".
 *
 * It only READS calendars. It returns the next week or so of events from every
 * calendar in your Google Calendar list. The web app address is the only key,
 * so keep it private. If it ever leaks, use Deploy > Manage deployments >
 * Archive, then make a new deployment and update the board.
 */
function doGet(e) {
  var days = Math.min(31, Math.max(1, Number(e && e.parameter && e.parameter.days) || 7));
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
          location: ev.getLocation() || ''
        };
      });
    } catch (err) { /* one unreadable calendar shouldn't break the rest */ }
    return { id: c.getId(), name: c.getName(), color: c.getColor(), events: events };
  });

  return ContentService.createTextOutput(JSON.stringify({ calendars: calendars }))
    .setMimeType(ContentService.MimeType.JSON);
}
