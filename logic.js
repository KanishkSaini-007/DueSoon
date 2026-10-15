/* DueSoon logic: pure functions, also used by tests.js */
(function (root) {
  var MIN = 60000, HOUR = 3600000, DAY = 86400000;

  function countdown(dueMs, nowMs) {
    var d = dueMs - nowMs, past = d < 0, a = Math.abs(d);
    var text;
    if (a < MIN) text = "now";
    else if (a < HOUR) text = Math.floor(a / MIN) + " min";
    else if (a < DAY) {
      var h = Math.floor(a / HOUR), m = Math.floor((a % HOUR) / MIN);
      text = h + "h" + (m ? " " + m + "m" : "");
    } else {
      var days = Math.floor(a / DAY), hh = Math.floor((a % DAY) / HOUR);
      text = days + "d" + (days < 3 && hh ? " " + hh + "h" : "");
    }
    if (text === "now") return "due now";
    return past ? text + " overdue" : "in " + text;
  }

  function startOfDay(ms) {
    var d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime();
  }

  /* bucket: overdue | today | week | later | done */
  function bucket(item, nowMs) {
    if (item.done) return "done";
    if (item.due < nowMs) return "overdue";
    var sod = startOfDay(nowMs);
    if (item.due < sod + DAY) return "today";
    if (item.due < sod + 7 * DAY) return "week";
    return "later";
  }

  function sortItems(items) {
    return items.slice().sort(function (a, b) {
      if (a.due !== b.due) return a.due - b.due;
      return (b.prio || 1) - (a.prio || 1);
    });
  }

  function nextUp(items, nowMs) {
    var open = sortItems(items.filter(function (i) { return !i.done; }));
    var upcoming = open.filter(function (i) { return i.due >= nowMs; });
    return upcoming[0] || open[0] || null;
  }

  function validate(data) {
    var list = data && Array.isArray(data.items) ? data.items : [];
    return list.filter(function (i) {
      return i && typeof i.title === "string" && i.title.trim() &&
        typeof i.due === "number" && isFinite(i.due);
    }).map(function (i) {
      return {
        id: String(i.id || Math.random().toString(36).slice(2)),
        title: i.title.trim().slice(0, 80),
        subject: typeof i.subject === "string" ? i.subject.trim().slice(0, 30) : "",
        due: i.due,
        prio: i.prio === 2 ? 2 : 1,
        done: !!i.done
      };
    });
  }

  var api = { countdown: countdown, bucket: bucket, sortItems: sortItems, nextUp: nextUp, validate: validate, startOfDay: startOfDay };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DueLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
