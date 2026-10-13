/* Home page front: rebuilds the latest edition (rendered by Jekyll into
   #home-edition-body) as the front-page layout. Reads the same structure
   edition.js relies on: section tables, "## n." story headings with ids,
   "How it was framed" lists with "Focus n:" lines, and a
   "Neutrality: n/10." paragraph. If anything is missing, the original
   edition body stays visible. Runs before edition.js so it reads raw text. */
(function () {
  var article = document.getElementById("edition");
  var src = document.getElementById("home-edition-body");
  var front = document.getElementById("home-front");
  if (!article || !src || !front) return;

  var editionUrl = article.getAttribute("data-edition-url") || "";

  function txt(el) {
    return (el ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function clamp(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return null;
    return Math.max(0, Math.min(10, n));
  }

  /* Same bands as edition.js: low = red, high = green. */
  function heat(n) {
    if (n <= 3) return 4;
    if (n <= 5) return 3;
    if (n <= 7) return 2;
    return 1;
  }

  function divergence(n) {
    if (n <= 4) return { label: "High", cls: "heat-4" };
    if (n <= 7) return { label: "Medium", cls: "heat-2" };
    return { label: "Low", cls: "heat-1" };
  }

  var ABBR = /(?:^|\s)(?:Mr|Mrs|Ms|Dr|St|Rep|Sen|Gov|Gen|Lt|Col|Sgt|Prof|Rev|No|vs|Jr|Sr|Inc|Ltd|Co|U\.S|U\.K|a\.m|p\.m)\.$/;

  function firstSentence(p) {
    var re = /[.!?]["\u201d\u2019')]*(?=\s+["\u201c\u2018(]?[A-Z0-9]|$)/g;
    var m;
    while ((m = re.exec(p))) {
      var end = m.index + m[0].length;
      var head = p.slice(0, m.index + 1);
      if (ABBR.test(head)) continue;
      if (/\b[A-Z]\.$/.test(head)) continue;
      return p.slice(0, end).trim();
    }
    return p;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function meter(n, label, small) {
    var w = el("span", "hf-meter hf-h" + heat(n) + (small ? " hf-meter-sm" : ""));
    w.setAttribute("role", "img");
    w.setAttribute("aria-label", label + " " + n + " out of 10");
    var track = el("span", "hf-track");
    var fill = el("span", "hf-fill");
    fill.style.width = Math.max(6, n * 10) + "%";
    track.appendChild(fill);
    w.appendChild(track);
    w.appendChild(el("b", null, String(n)));
    return w;
  }

  function stat(label, node) {
    var s = el("span", "hf-stat");
    s.appendChild(el("span", "hf-lbl", label));
    s.appendChild(node);
    return s;
  }

  function pill(n, suffix) {
    var d = divergence(n);
    return el("span", "hf-pill " + d.cls, d.label + (suffix || ""));
  }

  function readMore(id) {
    var a = el("a", "hf-more", "Read the full story");
    a.href = editionUrl + "#" + encodeURIComponent(id).replace(/%2D/g, "-");
    return a;
  }

  /* 1. Section tables: anchor id -> { title, section, ukAttention } */
  function readTables() {
    var map = {};
    var tables = src.querySelectorAll("table");
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var prev = table.previousElementSibling;
      var section = "";
      while (prev && !section) {
        if (prev.tagName === "P" && prev.firstElementChild && prev.firstElementChild.tagName === "STRONG" && txt(prev) === txt(prev.firstElementChild)) {
          section = txt(prev);
        } else if (prev.tagName === "TABLE" || prev.tagName === "H2" || prev.tagName === "HR") {
          break;
        }
        prev = prev.previousElementSibling;
      }
      var heads = table.querySelectorAll("thead th");
      var uaCol = -1;
      for (var h = 0; h < heads.length; h++) {
        if (/^UK attention$/i.test(txt(heads[h]))) uaCol = h;
      }
      var rows = table.querySelectorAll("tbody tr");
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll("td");
        var a = cells[0] && cells[0].querySelector('a[href^="#"]');
        if (!a) continue;
        var id = decodeURIComponent(a.getAttribute("href").slice(1));
        map[id] = {
          title: txt(a),
          section: section,
          ua: uaCol >= 0 && cells[uaCol] ? clamp(txt(cells[uaCol])) : null
        };
      }
    }
    return map;
  }

  function parseOutlet(li) {
    var c = li.cloneNode(true);
    var nested = c.querySelectorAll("ul, ol");
    for (var i = 0; i < nested.length; i++) nested[i].parentNode.removeChild(nested[i]);
    var full = txt(c);
    var fm = full.match(/(?:^|\s)Focus\s+(\d{1,2})(?:\s*\/\s*10)?\s*:\s*([\s\S]*)$/);
    if (!fm) return null;
    var head = full.slice(0, fm.index).trim();
    var dot = head.indexOf(" \u00b7 ");
    var pre = dot >= 0 ? head.slice(0, dot) : head;
    var kind = "";
    var km = pre.match(/\(([^()]*)\)\s*$/);
    if (km) {
      kind = km[1].trim();
      pre = pre.slice(0, km.index).trim();
    }
    var a = c.querySelector("a");
    var name = a ? txt(a) : "";
    if (!name || pre.indexOf(name) !== 0) {
      name = pre.split(",")[0].trim() || name;
    }
    return { name: name, kind: kind, focus: clamp(fm[1]), note: fm[2].trim(), href: a ? a.getAttribute("href") : "" };
  }

  /* 2. Stories from "## n." headings */
  function readStories(tableMap) {
    var stories = [];
    var hs = src.querySelectorAll("h2[id]");
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      var hm = txt(h).match(/^(\d{1,2})\.\s*(.+)$/);
      if (!hm) continue;
      var s = { n: parseInt(hm[1], 10), id: h.id, heading: hm[2], paras: [], outlets: [], neu: null, neuText: "", ua: null };
      var mode = "body";
      for (var node = h.nextElementSibling; node && node.tagName !== "H2"; node = node.nextElementSibling) {
        if (node.tagName === "P") {
          var strong = node.firstElementChild && node.firstElementChild.tagName === "STRONG" ? node.firstElementChild : null;
          var t = txt(node);
          var nm = t.match(/^(?:Neutrality|Bias Spread):\s*(\d{1,2})\s*\/\s*10\.?\s*([\s\S]*)$/);
          if (strong && nm) {
            s.neu = clamp(nm[1]);
            var rest = nm[2].trim();
            var um = rest.match(/\s*UK attention:\s*(\d{1,2})\s*\/\s*10\b[\s\S]*$/);
            if (um) {
              s.ua = clamp(um[1]);
              rest = rest.slice(0, um.index).trim();
            }
            s.neuText = rest;
            mode = "after";
          } else if (strong && /^How it was framed$/i.test(t)) {
            mode = "framed";
          } else if (mode === "body" && t) {
            s.paras.push(t);
          }
        } else if (node.tagName === "UL" && mode === "framed") {
          var lis = node.querySelectorAll(":scope > li");
          for (var l = 0; l < lis.length; l++) {
            var o = parseOutlet(lis[l]);
            if (o) s.outlets.push(o);
          }
        }
      }
      var tm = tableMap[s.id];
      s.title = tm && tm.title ? tm.title : s.heading;
      s.section = tm ? tm.section : "";
      if (s.ua == null && tm && tm.ua != null) s.ua = tm.ua;
      if (!s.section) s.section = s.n <= 5 ? "UK" : s.n <= 10 ? "World" : "What the world is leading with";
      if (s.neu != null) stories.push(s);
    }
    return stories;
  }

  function sectionKey(name) {
    if (/^UK$/i.test(name)) return "uk";
    if (/^World$/i.test(name)) return "world";
    if (/leading with/i.test(name)) return "lead";
    return "other";
  }

  function kicker(s) {
    var k = sectionKey(s.section);
    return k === "uk" ? "UK" : k === "world" ? "World" : k === "lead" ? "World lead" : s.section;
  }

  /* Outlet logos: reuse the local /assets/logos files listed in
     _data/outlets.yml (emitted as #natter-outlets by the layout). Match by
     link host first, like edition.js, then by normalised name. */
  var OUTLETS = [];
  try {
    var oj = document.getElementById("natter-outlets");
    OUTLETS = oj ? JSON.parse(oj.textContent) || [] : [];
  } catch (e) { OUTLETS = []; }

  var NAME_ALIAS = {
    "mail on sunday": "daily mail", "mail online": "daily mail", "dailymail": "daily mail", "mail": "daily mail",
    "sunday times": "times", "sunday telegraph": "telegraph", "observer": "guardian",
    "bbc news": "bbc", "express": "daily express", "sunday express": "daily express",
    "mirror": "daily mirror", "fox": "fox news", "france24": "france 24", "ria": "ria novosti",
    "abc": "abc news", "folha": "folha de s.paulo", "al jazeera english": "al jazeera"
  };

  function normName(n) {
    n = String(n || "").toLowerCase().replace(/[\u2018\u2019']/g, "").replace(/&/g, " and ")
      .replace(/\.(com|co\.uk)\b/g, "").replace(/\s+/g, " ").trim().replace(/^the /, "");
    return NAME_ALIAS[n] || n;
  }

  function findOutlet(o) {
    var host = "";
    if (o.href) {
      try { host = new URL(o.href, window.location.href).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { host = ""; }
    }
    var best = null, bestLen = -1, i, j;
    if (host) {
      for (i = 0; i < OUTLETS.length; i++) {
        var hs = OUTLETS[i].hosts || [];
        for (j = 0; j < hs.length; j++) {
          var nd = String(hs[j]).toLowerCase().replace(/^www\./, "");
          if (nd && (host === nd || host.slice(-nd.length - 1) === "." + nd) && nd.length > bestLen) {
            best = OUTLETS[i]; bestLen = nd.length;
          }
        }
      }
      if (best) return best;
    }
    var key = normName(o.name);
    for (i = 0; i < OUTLETS.length; i++) if (normName(OUTLETS[i].name) === key) return OUTLETS[i];
    return null;
  }

  function outletCard(o) {
    var c = el("div", "hf-ocard");
    var head = el("div", "hf-ohead");
    var nm = el("span", "hf-oname");
    var ref = findOutlet(o);
    if (ref && ref.logo) {
      var img = document.createElement("img");
      img.className = "hf-ologo";
      img.src = ref.logo;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.decoding = "async";
      img.addEventListener("error", function () { if (img.parentNode) img.parentNode.removeChild(img); });
      nm.appendChild(img);
      c.setAttribute("data-logo", "1");
    }
    nm.appendChild(el("span", "hf-otxt", o.name));
    head.appendChild(nm);
    if (o.focus != null) head.appendChild(meter(o.focus, "Focus", true));
    c.appendChild(head);
    if (o.note) c.appendChild(el("p", null, o.note));
    if (o.kind) c.appendChild(el("span", "hf-okind", o.kind));
    return c;
  }

  function byFocus(list) {
    var idx = list.map(function (o, i) { return { o: o, i: i }; });
    idx.sort(function (x, y) {
      var fx = x.o.focus == null ? -1 : x.o.focus, fy = y.o.focus == null ? -1 : y.o.focus;
      return fy - fx || x.i - y.i;
    });
    return idx.map(function (x) { return x.o; });
  }

  function grid(list) {
    var g = el("div", "hf-ogrid");
    for (var i = 0; i < list.length; i++) g.appendChild(outletCard(list[i]));
    return g;
  }

  function hero(s) {
    var a = el("article", "hf-hero");
    a.appendChild(el("p", "hf-kicker", kicker(s) + " \u00b7 Lead story"));
    a.appendChild(el("h2", null, s.title));
    if (s.paras[0]) a.appendChild(el("p", "hf-dek", firstSentence(s.paras[0])));
    var info = el("div", "hf-info");
    var row = el("div", "hf-info-row");
    row.appendChild(stat("Neutrality", meter(s.neu, "Neutrality")));
    row.appendChild(stat("Framing divergence", pill(s.neu)));
    info.appendChild(row);
    if (s.neuText) info.appendChild(el("p", "hf-info-note", s.neuText));
    a.appendChild(info);
    if (s.outlets.length) {
      a.appendChild(el("h3", "hf-sub", "How it was framed"));
      var sorted = byFocus(s.outlets);
      var rest = [];
      if (sorted.length <= 4) {
        a.appendChild(grid(sorted));
      } else {
        var top = sorted.slice(0, 2), low = sorted.slice(sorted.length - 2);
        rest = sorted.slice(2, sorted.length - 2);
        var split = el("div", "hf-osplit");
        split.appendChild(el("p", "hf-lbl", "Highest Focus"));
        split.appendChild(grid(top));
        split.appendChild(el("p", "hf-lbl", "Lowest Focus"));
        split.appendChild(grid(low));
        a.appendChild(split);
      }
      if (rest.length) {
        var d = el("details", "hf-all");
        var sum = el("summary", null, "See all " + s.outlets.length + " outlets");
        d.appendChild(sum);
        d.appendChild(grid(rest));
        d.addEventListener("toggle", function () {
          sum.textContent = d.open ? "Show fewer outlets" : "See all " + s.outlets.length + " outlets";
        });
        a.appendChild(d);
      }
    }
    var foot = el("p", "hf-readrow");
    foot.appendChild(readMore(s.id));
    a.appendChild(foot);
    return a;
  }

  function card(s) {
    var a = el("article", "hf-card");
    a.appendChild(el("p", "hf-kicker", kicker(s)));
    a.appendChild(el("h3", null, s.title));
    if (s.paras[0]) a.appendChild(el("p", "hf-sum", firstSentence(s.paras[0])));
    var meta = el("div", "hf-cmeta");
    meta.appendChild(stat("Neutrality", meter(s.neu, "Neutrality", true)));
    meta.appendChild(pill(s.neu, " divergence"));
    if (sectionKey(s.section) === "lead" && s.ua != null) meta.appendChild(stat("UK attention", meter(s.ua, "UK attention", true)));
    a.appendChild(meta);
    a.appendChild(readMore(s.id));
    return a;
  }

  function sectionIntro(name) {
    var tables = src.querySelectorAll("p > strong");
    for (var i = 0; i < tables.length; i++) {
      var p = tables[i].parentNode;
      if (txt(p) !== name) continue;
      var next = p.nextElementSibling;
      if (next && next.tagName === "P" && !next.querySelector("strong")) return txt(next);
    }
    return "";
  }

  function build() {
    var stories = readStories(readTables());
    if (!stories.length) return false;
    var lead = stories[0];
    var frag = document.createDocumentFragment();
    frag.appendChild(hero(lead));

    var order = [];
    var groups = {};
    for (var i = 1; i < stories.length; i++) {
      var s = stories[i];
      if (!groups[s.section]) {
        groups[s.section] = [];
        order.push(s.section);
      }
      groups[s.section].push(s);
    }
    if (order.length) {
      frag.appendChild(el("h2", "hf-morehead", "More stories"));
      for (var g = 0; g < order.length; g++) {
        var sec = el("section", "hf-sec");
        sec.appendChild(el("h2", "hf-sech", order[g]));
        if (sectionKey(order[g]) === "lead") {
          var intro = sectionIntro(order[g]);
          if (intro) sec.appendChild(el("p", "hf-secintro", intro));
        }
        var cg = el("div", "hf-cgrid");
        for (var c = 0; c < groups[order[g]].length; c++) cg.appendChild(card(groups[order[g]][c]));
        sec.appendChild(cg);
        frag.appendChild(sec);
      }
    }
    front.appendChild(frag);
    var share = src.querySelector(".share-row");
    if (share) front.appendChild(share);
    return true;
  }

  try {
    if (build()) {
      front.hidden = false;
      src.hidden = true;
      document.body.classList.add("home-ready");
    }
  } catch (err) {
    while (front.firstChild) front.removeChild(front.firstChild);
    front.hidden = true;
    src.hidden = false;
  }
})();
