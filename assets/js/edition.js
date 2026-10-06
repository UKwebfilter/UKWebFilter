/* Edition presentation.
   In a "How it was framed" list, "Focus n/10" or "Focus n" becomes a heat pill.
   "Bias Spread: n/10" and the Bias Spread table column use the same scale:
   1–3 red (bad), 4–5 orange, 6–7 yellow, 8–10 green (good). */
(function () {
  var outlets = [];
  var dataEl = document.getElementById("natter-outlets");
  if (dataEl) {
    try {
      outlets = JSON.parse(dataEl.textContent);
    } catch (err) {
      outlets = [];
    }
  }

  function clampScore(score) {
    if (isNaN(score)) return 0;
    return Math.max(0, Math.min(10, score));
  }

  /* Heat scale: low = bad (red), high = good (green). */
  function heatClass(score) {
    var n = clampScore(score);
    if (n <= 3) return "heat-4";
    if (n <= 5) return "heat-3";
    if (n <= 7) return "heat-2";
    return "heat-1";
  }

  function chip(score, label) {
    var span = document.createElement("span");
    span.className = "score-heat " + heatClass(score);
    span.textContent = label;
    return span;
  }

  function findOutlet(anchor) {
    var host = "";
    try {
      host = new URL(anchor.href, window.location.href).hostname.toLowerCase().replace(/^www\./, "");
    } catch (err) {
      host = "";
    }
    var label = anchor.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    var best = null;
    var bestLen = -1;
    var i, j, outlet, needle;
    for (i = 0; i < outlets.length; i++) {
      outlet = outlets[i];
      if (!outlet.hosts) continue;
      for (j = 0; j < outlet.hosts.length; j++) {
        needle = String(outlet.hosts[j]).toLowerCase().replace(/^www\./, "");
        if (host === needle || (needle && host.endsWith("." + needle))) {
          if (needle.length > bestLen) {
            best = outlet;
            bestLen = needle.length;
          }
        }
      }
    }
    if (best) return best;
    for (i = 0; i < outlets.length; i++) {
      outlet = outlets[i];
      if (outlet.name && label === String(outlet.name).toLowerCase()) return outlet;
    }
    return null;
  }

  function replaceLogo(img) {
    if (!img || !img.parentNode || img.getAttribute("data-replaced") === "1") return;
    img.setAttribute("data-replaced", "1");
    var mark = document.createElement("span");
    mark.className = "outlet-logo outlet-letter";
    mark.style.background = img.getAttribute("data-color") || "#3f3b34";
    mark.textContent = img.getAttribute("data-letter") || "?";
    mark.setAttribute("aria-hidden", "true");
    img.replaceWith(mark);
  }

  function bindLogoError(img) {
    if (!img || img.getAttribute("data-logo-bound") === "1") return;
    img.setAttribute("data-logo-bound", "1");
    img.addEventListener("error", function () {
      replaceLogo(img);
    });
    if (img.complete && img.naturalWidth === 0) replaceLogo(img);
  }

  function logoBefore(anchor, outlet) {
    if (anchor.previousElementSibling && anchor.previousElementSibling.classList.contains("outlet-logo")) return;
    var img = document.createElement("img");
    img.className = "outlet-logo";
    img.width = 18;
    img.height = 18;
    img.alt = "";
    img.setAttribute("data-letter", outlet.letter || "?");
    img.setAttribute("data-color", outlet.color || "#3f3b34");
    img.src = outlet.logo;
    anchor.parentNode.insertBefore(img, anchor);
    bindLogoError(img);
  }

  var focusToken = /(?<![A-Za-z])Focus\s+(\d{1,2})\s*(?:\/\s*10)?|\((?:UK|US|China|Iran|Russia|Qatar|Brazil|Israel|France|Germany|EU)\b[^)\n]{0,70}\)/g;

  function paintText(node) {
    var parent = node.parentNode;
    if (!parent || parent.closest("code, pre, script, style, .focus-pill, .score-heat, .outlet-ctx, a")) return;
    var text = node.nodeValue;
    if (!text || (text.indexOf("Focus") === -1 && text.indexOf("(") === -1)) return;
    focusToken.lastIndex = 0;
    if (!focusToken.test(text)) return;
    focusToken.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0;
    var match;
    while ((match = focusToken.exec(text))) {
      if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      if (match[1]) {
        var score = clampScore(parseInt(match[1], 10));
        var pill = document.createElement("span");
        pill.className = "focus-pill " + heatClass(score);
        pill.title = "Focus " + score + "/10";
        pill.textContent = "Focus " + score;
        frag.appendChild(pill);
      } else {
        var ctx = document.createElement("span");
        ctx.className = "outlet-ctx";
        ctx.textContent = match[0];
        frag.appendChild(ctx);
      }
      last = match.index + match[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, node);
  }

  function enhanceLists(root) {
    var lists = root.querySelectorAll("ul");
    var u, ul, prev, heading, label, anchors, a, outlet, items, li, walker, nodes, n;
    for (u = 0; u < lists.length; u++) {
      ul = lists[u];
      prev = ul.previousElementSibling;
      heading = prev ? prev.querySelector("strong") : null;
      label = heading ? heading.textContent.replace(/\s+/g, " ").trim().toLowerCase() : "";
      if (label.indexOf("how it was framed") === -1) continue;
      ul.classList.add("framed-list");
      anchors = ul.querySelectorAll("a");
      for (a = 0; a < anchors.length; a++) {
        outlet = findOutlet(anchors[a]);
        if (outlet) logoBefore(anchors[a], outlet);
      }
      items = ul.querySelectorAll("li");
      for (li = 0; li < items.length; li++) items[li].classList.add("outlet-row");
      walker = document.createTreeWalker(ul, NodeFilter.SHOW_TEXT, null);
      nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (n = 0; n < nodes.length; n++) paintText(nodes[n]);
    }
  }

  function enhanceSpreads(root) {
    var strongs = root.querySelectorAll("p > strong");
    var i, strong, text, match, score, rest;
    for (i = 0; i < strongs.length; i++) {
      strong = strongs[i];
      if (strong.querySelector(".score-heat")) continue;
      text = strong.textContent.replace(/\s+/g, " ").trim();
      match = text.match(/^Bias Spread:\s*(\d+)\s*\/\s*10(.*)$/i);
      if (!match) continue;
      score = clampScore(parseInt(match[1], 10));
      rest = match[2] || "";
      strong.textContent = "";
      strong.appendChild(document.createTextNode("Bias Spread: "));
      strong.appendChild(chip(score, score + "/10"));
      if (rest) strong.appendChild(document.createTextNode(rest));
    }
  }

  function headerIndex(headers, needle) {
    var i;
    for (i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().indexOf(needle) !== -1) return i;
    }
    return -1;
  }

  function enhanceTable(root) {
    var table = root.querySelector("table");
    if (!table) return;
    var wrap = table.parentElement;
    if (!wrap || !wrap.classList.contains("table-wrap")) {
      wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    }

    var headers = [];
    var headCells = table.querySelectorAll("thead th");
    var h, rows, r, cells, c, cell, raw, value, label;
    for (h = 0; h < headCells.length; h++) {
      headCells[h].setAttribute("scope", "col");
      headers.push(headCells[h].textContent.replace(/\s+/g, " ").trim());
    }
    var biasIndex = headerIndex(headers, "bias");
    var promIndex = headerIndex(headers, "prominence");
    if (biasIndex >= 0) headCells[biasIndex].classList.add("col-bias");
    if (promIndex >= 0) headCells[promIndex].classList.add("col-prom");

    table.classList.add("cards");
    rows = table.querySelectorAll("tbody tr");
    for (r = 0; r < rows.length; r++) {
      cells = rows[r].children;
      if (biasIndex >= 0 && cells[biasIndex] && cells[biasIndex].tagName === "TD") {
        cell = cells[biasIndex];
        raw = cell.textContent.replace(/\s+/g, " ").trim();
        value = raw.match(/^(\d+)\s*(?:\/\s*10)?$/);
        if (value && !cell.querySelector(".score-heat")) {
          cell.textContent = "";
          cell.appendChild(chip(parseInt(value[1], 10), String(parseInt(value[1], 10))));
        }
        cell.classList.add("col-bias");
      }
      if (promIndex >= 0 && cells[promIndex] && cells[promIndex].tagName === "TD") {
        cells[promIndex].classList.add("col-prom");
      }
      for (c = 0; c < cells.length; c++) {
        if (cells[c].tagName === "TH" || cells[c].querySelector(".cell-label") || !headers[c]) continue;
        label = document.createElement("span");
        label.className = "cell-label";
        label.textContent = headers[c];
        cells[c].insertBefore(label, cells[c].firstChild);
      }
    }

    var share = root.querySelector(".share-row");
    if (share && wrap.nextSibling !== share) wrap.after(share);
  }

  function bindCopy(button) {
    button.addEventListener("click", function () {
      var url = button.getAttribute("data-url") || window.location.href;
      var done = function () {
        var previous = button.textContent;
        button.textContent = "Copied";
        button.classList.add("is-copied");
        window.setTimeout(function () {
          button.textContent = previous;
          button.classList.remove("is-copied");
        }, 2000);
      };
      var fallback = function () {
        var input = document.createElement("input");
        input.value = url;
        input.setAttribute("aria-hidden", "true");
        document.body.appendChild(input);
        input.select();
        try {
          document.execCommand("copy");
          done();
        } catch (err) {
          /* Leave the button unchanged when the browser blocks the copy. */
        }
        document.body.removeChild(input);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, fallback);
      } else {
        fallback();
      }
    });
  }

  function bindNewsletter(form) {
    form.addEventListener("submit", function (event) {
      var action = form.getAttribute("action") || "";
      if (action && action !== "#") return;
      event.preventDefault();
      var status = form.querySelector(".newsletter-status");
      if (!status) return;
      status.hidden = false;
      status.textContent = "Email signup isn’t connected yet.";
    });
  }

  function enhance(root) {
    if (root.getAttribute("data-natter") === "1") return;
    root.setAttribute("data-natter", "1");
    enhanceLists(root);
    enhanceSpreads(root);
    enhanceTable(root);
  }

  var bodies = document.querySelectorAll(".edition-body");
  var b;
  for (b = 0; b < bodies.length; b++) enhance(bodies[b]);

  var copies = document.querySelectorAll(".share-copy");
  for (b = 0; b < copies.length; b++) bindCopy(copies[b]);

  var logos = document.querySelectorAll("img.outlet-logo");
  for (b = 0; b < logos.length; b++) bindLogoError(logos[b]);

  var forms = document.querySelectorAll(".newsletter-form");
  for (b = 0; b < forms.length; b++) bindNewsletter(forms[b]);
})();
