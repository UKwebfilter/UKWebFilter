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

  function pill(n, suffix) {
    var d = divergence(n);
    return el("span", "hf-pill " + d.cls, d.label + (suffix || ""));
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

  function byFocus(list) {
    var idx = list.map(function (o, i) { return { o: o, i: i }; });
    idx.sort(function (x, y) {
      var fx = x.o.focus == null ? -1 : x.o.focus, fy = y.o.focus == null ? -1 : y.o.focus;
      return fy - fx || x.i - y.i;
    });
    return idx.map(function (x) { return x.o; });
  }

  /* Local story tiles from the edition front matter (banner_tiles), emitted
     by index.html as #home-tiles. tile-NN.webp belongs to story NN. */
  var TILES = {};
  try {
    var tj = document.getElementById("home-tiles");
    var tl = tj ? JSON.parse(tj.textContent) || [] : [];
    for (var ti = 0; ti < tl.length; ti++) {
      var tm = String(tl[ti]).match(/tile-(\d+)\.\w+$/);
      if (tm) TILES[parseInt(tm[1], 10)] = tl[ti];
    }
  } catch (e) { TILES = {}; }

  function href(s) {
    return editionUrl + "#" + encodeURIComponent(s.id).replace(/%2D/g, "-");
  }

  function link(s, cls, text) {
    var a = el("a", cls, text);
    a.href = href(s);
    return a;
  }

  function tileImg(s, cls, eager) {
    var src = TILES[s.n];
    if (!src) return null;
    var img = document.createElement("img");
    img.className = cls;
    img.src = src;
    img.alt = "";
    img.width = 308;
    img.height = 272;
    img.decoding = "async";
    if (!eager) img.loading = "lazy";
    img.addEventListener("error", function () { if (img.parentNode) img.parentNode.removeChild(img); });
    return img;
  }

  function nmeter(n, label) {
    var w = el("span", "nf-meter hf-h" + heat(n));
    w.setAttribute("role", "img");
    w.setAttribute("aria-label", label + " " + n + " out of 10");
    w.appendChild(el("span", "nf-ml", label));
    var bar = el("span", "nf-bar");
    var fill = el("i");
    fill.style.width = Math.max(6, n * 10) + "%";
    bar.appendChild(fill);
    w.appendChild(bar);
    w.appendChild(el("b", null, n + "/10"));
    return w;
  }

  function metrics(s) {
    var m = el("div", "nf-metrics");
    m.appendChild(nmeter(s.neu, "Neutrality"));
    m.appendChild(pill(s.neu, " divergence"));
    return m;
  }

  function headline(tag, s) {
    var h = el(tag);
    h.appendChild(link(s, null, s.title));
    return h;
  }

  function summary(s, cls) {
    return s.paras[0] ? el("p", cls || "nf-sum", firstSentence(s.paras[0])) : null;
  }

  function add(parent, child) { if (child) parent.appendChild(child); return parent; }

  function ocard(o, withNote) {
    var c = el("div", "nf-oc");
    var ref = findOutlet(o);
    if (ref && ref.logo) {
      var img = document.createElement("img");
      img.className = "nf-ologo";
      img.src = ref.logo;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.decoding = "async";
      img.addEventListener("error", function () { if (img.parentNode) img.parentNode.removeChild(img); });
      c.appendChild(img);
      c.setAttribute("data-logo", "1");
    } else {
      c.appendChild(el("span", "nf-olt", (o.name || "?").charAt(0)));
    }
    c.appendChild(el("span", "nf-on", o.name));
    if (o.focus != null) c.appendChild(el("span", "nf-fs hf-h" + heat(o.focus), "Focus " + o.focus));
    if (withNote && o.note) c.appendChild(el("p", "nf-onote", o.note));
    return c;
  }

  function ogrid(list, withNote) {
    var g = el("div", "nf-ocs");
    for (var i = 0; i < list.length; i++) g.appendChild(ocard(list[i], withNote));
    return g;
  }

  function framing(s) {
    var f = el("div", "nf-framed");
    f.appendChild(el("h4", "nf-boxh", "How it was framed"));
    var sorted = byFocus(s.outlets);
    if (sorted.length <= 4) {
      f.appendChild(ogrid(sorted, false));
    } else {
      var split = el("div", "nf-fsplit");
      var hi = el("div"), lo = el("div");
      hi.appendChild(el("p", "nf-fl", "Highest Focus"));
      hi.appendChild(ogrid(sorted.slice(0, 2), false));
      lo.appendChild(el("p", "nf-fl", "Lowest Focus"));
      lo.appendChild(ogrid(sorted.slice(sorted.length - 2), false));
      split.appendChild(hi);
      split.appendChild(lo);
      f.appendChild(split);
      var d = el("details", "nf-all");
      var sum = el("summary", null, "See all " + s.outlets.length + " outlets");
      d.appendChild(sum);
      var all = ogrid(s.outlets, true);
      all.className = "nf-ocs nf-ocs-all";
      d.appendChild(all);
      d.addEventListener("toggle", function () {
        sum.textContent = d.open ? "Show fewer outlets" : "See all " + s.outlets.length + " outlets";
      });
      f.appendChild(d);
    }
    return f;
  }

  function leadStory(s) {
    var a = el("article", "nf-lead");
    var im = tileImg(s, null, true);
    if (im) {
      var ia = link(s, "nf-limg");
      ia.setAttribute("tabindex", "-1");
      ia.setAttribute("aria-hidden", "true");
      ia.appendChild(im);
      a.appendChild(ia);
    } else {
      a.className += " nf-noimg";
    }
    var t = el("div", "nf-ltext");
    t.appendChild(el("p", "nf-kicker", kicker(s)));
    t.appendChild(headline("h2", s));
    add(t, summary(s, "nf-lsum"));
    t.appendChild(metrics(s));
    t.appendChild(link(s, "nf-more", "Read the full story"));
    a.appendChild(t);
    return a;
  }

  function sideStory(s) {
    var a = el("article", "nf-side");
    var im = tileImg(s, null, true);
    if (im) {
      var ia = link(s, "nf-simg");
      ia.setAttribute("tabindex", "-1");
      ia.setAttribute("aria-hidden", "true");
      ia.appendChild(im);
      a.appendChild(ia);
    } else {
      a.className += " nf-noimg";
    }
    var t = el("div");
    t.appendChild(el("p", "nf-kicker", kicker(s)));
    t.appendChild(headline("h3", s));
    add(t, summary(s));
    t.appendChild(nmeter(s.neu, "Neutrality"));
    a.appendChild(t);
    return a;
  }

  function dividedBox(stories) {
    var idx = stories.map(function (s, i) { return { s: s, i: i }; });
    idx.sort(function (x, y) { return x.s.neu - y.s.neu || x.i - y.i; });
    var box = el("div", "nf-divbox");
    box.appendChild(el("h4", "nf-boxh", "Most divided today"));
    var ol = el("ol");
    for (var i = 0; i < Math.min(3, idx.length); i++) {
      var s = idx[i].s;
      var li = el("li");
      li.appendChild(el("span", "nf-num", String(i + 1)));
      li.appendChild(link(s, null, s.title));
      li.appendChild(el("span", "nf-sc hf-h" + heat(s.neu), s.neu + "/10"));
      ol.appendChild(li);
    }
    box.appendChild(ol);
    box.appendChild(el("p", "nf-dnote", "Lowest Neutrality scores"));
    return box;
  }

  function card(s) {
    var textOnly = !TILES[s.n];
    var a = el("article", "nf-card" + (textOnly ? " nf-textonly" : ""));
    if (!textOnly) {
      var ia = link(s, "nf-cimg");
      ia.setAttribute("tabindex", "-1");
      ia.setAttribute("aria-hidden", "true");
      ia.appendChild(tileImg(s));
      a.appendChild(ia);
    }
    var body = el("div", "nf-cbody");
    if (textOnly && sectionKey(s.section) === "lead" && s.ua != null) {
      var att = el("div", "nf-att");
      att.appendChild(nmeter(s.ua, "UK attention"));
      body.appendChild(att);
    }
    body.appendChild(el("p", "nf-kicker", kicker(s)));
    body.appendChild(headline("h3", s));
    add(body, summary(s));
    body.appendChild(metrics(s));
    body.appendChild(link(s, "nf-more", "Read the full story"));
    a.appendChild(body);
    return a;
  }

  /* Cards sit on a 6-column grid so every row is full:
     n % 3 == 0 -> rows of 3; n % 3 == 2 -> first row of 2 wide cards;
     n % 3 == 1 -> first card spans the full row. */
  function cardGrid(list) {
    var g = el("div", "nf-grid");
    var r = list.length % 3;
    for (var i = 0; i < list.length; i++) {
      var c = card(list[i]);
      if (r === 1 && i === 0) c.className += " nf-span6";
      else if (r === 2 && i < 2) c.className += " nf-span3";
      g.appendChild(c);
    }
    return g;
  }

  function sectionIntro(name) {
    var ps = src.querySelectorAll("p > strong");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i].parentNode;
      if (txt(p) !== name) continue;
      var next = p.nextElementSibling;
      if (next && next.tagName === "P" && !next.querySelector("strong")) return txt(next);
    }
    return "";
  }

  function ticker(stories) {
    var inner = document.querySelector(".masthead-inner");
    if (!inner) return null;
    var t = el("div", "nf-ticker");
    t.setAttribute("aria-label", "Latest headlines");
    t.appendChild(el("span", "nf-tl", "Latest"));
    var ul = el("ul");
    for (var i = 0; i < stories.length; i++) {
      var li = el("li");
      li.appendChild(link(stories[i], null, stories[i].title));
      ul.appendChild(li);
    }
    t.appendChild(ul);
    inner.appendChild(t);
    return t;
  }

  function build() {
    var stories = readStories(readTables());
    if (stories.length < 4) return false;
    var lead = stories[0];
    var frag = document.createDocumentFragment();

    /* Top: lead story with its framing underneath (left), right column
       with the next two stories and the most divided box. */
    var top = el("section", "nf-top");
    var main = el("div", "nf-main");
    main.appendChild(leadStory(lead));
    if (lead.outlets.length) main.appendChild(framing(lead));
    top.appendChild(main);
    var rcol = el("aside", "nf-rcol");
    rcol.setAttribute("aria-label", "More top stories");
    var side = stories.slice(1, 3);
    for (var i = 0; i < side.length; i++) rcol.appendChild(sideStory(side[i]));
    rcol.appendChild(dividedBox(stories));
    top.appendChild(rcol);
    frag.appendChild(top);

    var order = [], groups = {};
    for (var j = 3; j < stories.length; j++) {
      var s = stories[j];
      if (!groups[s.section]) { groups[s.section] = []; order.push(s.section); }
      groups[s.section].push(s);
    }
    for (var g = 0; g < order.length; g++) {
      var sec = el("section", "nf-sec");
      sec.appendChild(el("h2", "nf-secbar", order[g]));
      if (sectionKey(order[g]) === "lead") {
        var intro = sectionIntro(order[g]);
        if (intro) sec.appendChild(el("p", "nf-intro", intro));
      }
      sec.appendChild(cardGrid(groups[order[g]]));
      frag.appendChild(sec);
    }
    front.appendChild(frag);
    var share = src.querySelector(".share-row");
    if (share) front.appendChild(share);
    ticker(stories);
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
    var tk = document.querySelector(".nf-ticker");
    if (tk) tk.parentNode.removeChild(tk);
    front.hidden = true;
    src.hidden = false;
  }
})();
