(function () {
  var L = DueLogic, KEY = "duesoon-v1";
  var $ = function (id) { return document.getElementById(id); };
  var items = [], filter = "all";
  try { items = L.validate(JSON.parse(localStorage.getItem(KEY) || '{"items":[]}')); } catch (e) {}

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, items: items })); }
    catch (e) { say("Storage is unavailable. Export a backup before leaving."); }
  }
  function say(t) { $("status").textContent = t; }
  function el(tag, text, cls) {
    var n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function fmt(ms) {
    return new Date(ms).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  function badgeClass(b) {
    return b === "overdue" ? "badge" : b === "today" ? "badge soon" : b === "done" ? "badge dn" : "badge later";
  }

  function renderNext() {
    var box = $("next"), n = L.nextUp(items, Date.now());
    box.replaceChildren();
    if (!n) {
      box.className = "next empty";
      box.append(el("div", "Nothing due. Add a deadline below and it will show up here."));
      return;
    }
    box.className = "next";
    box.append(el("small", n.due < Date.now() ? "Overdue, do this first" : "Next up"));
    box.append(el("h2", n.title + (n.subject ? " (" + n.subject + ")" : "")));
    box.append(el("div", L.countdown(n.due, Date.now()), "big"));
    box.append(el("div", fmt(n.due), "meta"));
  }

  function renderFilters() {
    var subjects = Array.from(new Set(items.map(function (i) { return i.subject; }).filter(Boolean))).sort();
    var opts = ["all"].concat(subjects);
    if (opts.indexOf(filter) < 0) filter = "all";
    $("filters").replaceChildren.apply($("filters"), opts.map(function (s) {
      var b = el("button", s === "all" ? "All" : s, "chip");
      b.type = "button";
      b.setAttribute("aria-pressed", String(s === filter));
      b.onclick = function () { filter = s; render(); };
      return b;
    }));
  }

  var TITLES = { overdue: "Overdue", today: "Today", week: "This week", later: "Later", done: "Done" };

  function renderLists() {
    var now = Date.now(), host = $("lists");
    host.replaceChildren();
    var view = items.filter(function (i) { return filter === "all" || i.subject === filter; });
    var groups = { overdue: [], today: [], week: [], later: [], done: [] };
    L.sortItems(view).forEach(function (i) { groups[L.bucket(i, now)].push(i); });
    var any = false;
    Object.keys(TITLES).forEach(function (k) {
      if (!groups[k].length) return;
      any = true;
      host.append(el("h3", TITLES[k] + " (" + groups[k].length + ")", k === "overdue" ? "over" : ""));
      var ul = el("ul");
      groups[k].forEach(function (i) {
        var li = el("li", undefined, i.done ? "done" : "");
        var cb = el("input"); cb.type = "checkbox"; cb.checked = i.done;
        cb.setAttribute("aria-label", "Mark done: " + i.title);
        cb.onchange = function () { i.done = cb.checked; save(); render(); };
        var mid = el("div", undefined, "grow");
        mid.append(el("div", (i.prio === 2 ? "! " : "") + i.title, "t"));
        mid.append(el("div", (i.subject ? i.subject + " - " : "") + fmt(i.due), "meta"));
        var bd = el("span", i.done ? "done" : L.countdown(i.due, now), badgeClass(k));
        var del = el("button", "\u00d7", "del"); del.type = "button";
        del.setAttribute("aria-label", "Delete: " + i.title);
        del.onclick = function () {
          items = items.filter(function (x) { return x.id !== i.id; });
          save(); render(); say("Deleted: " + i.title);
        };
        li.append(cb, mid, bd, del);
        ul.append(li);
      });
      host.append(ul);
    });
    if (!any) host.append(el("p", "No deadlines here yet.", "hint"));
  }

  function render() { renderNext(); renderFilters(); renderLists(); }

  function defaultDue() {
    var d = new Date(Date.now() + 86400000); d.setHours(23, 59, 0, 0);
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  $("due").value = defaultDue();

  $("form").onsubmit = function (e) {
    e.preventDefault();
    var title = $("title").value.trim(), due = new Date($("due").value).getTime();
    if (!title || !isFinite(due)) { say("Add a title and a valid date."); return; }
    items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: title, subject: $("subject").value.trim(), due: due, prio: Number($("prio").value) === 2 ? 2 : 1, done: false });
    save(); $("title").value = ""; $("due").value = defaultDue(); render();
    say("Added: " + title); $("title").focus();
  };

  $("clear").onclick = function () {
    var n = items.filter(function (i) { return i.done; }).length;
    if (!n) { say("Nothing done to clear."); return; }
    items = items.filter(function (i) { return !i.done; }); save(); render(); say("Cleared " + n + " done.");
  };
  $("export").onclick = function () {
    var blob = new Blob([JSON.stringify({ version: 1, items: items }, null, 2)], { type: "application/json" });
    var a = el("a"); a.href = URL.createObjectURL(blob); a.download = "duesoon-backup.json"; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    say("Backup downloaded.");
  };
  $("import").onclick = function () { $("file").click(); };
  $("file").onchange = function () {
    var f = $("file").files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var got = L.validate(JSON.parse(r.result));
        if (!got.length) { say("No valid deadlines found in that file."); return; }
        var have = new Set(items.map(function (i) { return i.id; }));
        got.forEach(function (i) { if (!have.has(i.id)) items.push(i); });
        save(); render(); say("Imported " + got.length + " deadlines.");
      } catch (e) { say("That file could not be read."); }
    };
    r.readAsText(f); $("file").value = "";
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { e.preventDefault(); $("title").focus(); }
  });

  render();
  setInterval(render, 60000);
})();
