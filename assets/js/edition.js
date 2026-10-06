(function () {
  function band(score) {
    if (score <= 3) return "low";
    if (score <= 6) return "mid";
    return "high";
  }

  function enhance(root) {
    var paragraphs = root.querySelectorAll("p");
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var strong = p.querySelector("strong");
      if (!strong || p.getAttribute("data-enhanced") === "1") continue;
      var label = strong.textContent.replace(/\s+/g, " ").trim();
      var match = label.match(/^Bias Spread:\s*(\d+)\s*\/\s*10\b/i);
      if (!match) continue;

      var score = parseInt(match[1], 10);
      if (isNaN(score)) continue;
      score = Math.max(0, Math.min(10, score));

      var copy = document.createElement("span");
      copy.className = "spread-copy";
      while (p.firstChild) copy.appendChild(p.firstChild);

      var meter = document.createElement("span");
      meter.className = "spread-meter";
      meter.setAttribute("aria-hidden", "true");

      var num = document.createElement("b");
      num.textContent = score + "/10";

      var bar = document.createElement("span");
      bar.className = "spread-bar";
      for (var n = 1; n <= 10; n++) {
        var seg = document.createElement("i");
        if (n <= score) seg.className = "on";
        bar.appendChild(seg);
      }

      meter.appendChild(num);
      meter.appendChild(bar);
      p.appendChild(meter);
      p.appendChild(copy);
      p.className += (p.className ? " " : "") + "spread spread-" + band(score);
      p.setAttribute("data-score", String(score));
      p.setAttribute("data-enhanced", "1");
    }

    var tables = root.querySelectorAll("table");
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      if (!table.parentElement.classList.contains("table-wrap")) {
        var wrap = document.createElement("div");
        wrap.className = "table-wrap";
        wrap.setAttribute("tabindex", "0");
        wrap.setAttribute("role", "region");
        wrap.setAttribute("aria-label", "Story ranking");
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }

      var headers = [];
      var headCells = table.querySelectorAll("thead th");
      for (var h = 0; h < headCells.length; h++) headers.push(headCells[h].textContent.trim());
      table.classList.add("cards");

      var rows = table.querySelectorAll("tr");
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].children;
        for (var c = 0; c < cells.length; c++) {
          if (cells[c].tagName === "TH" || cells[c].querySelector(".cell-label")) continue;
          if (!headers[c]) continue;
          var label = document.createElement("span");
          label.className = "cell-label";
          label.textContent = headers[c];
          cells[c].insertBefore(label, cells[c].firstChild);
        }

        var cell = rows[r].children[1];
        if (!cell || cell.tagName === "TH") continue;
        var raw = "";
        for (var node = 0; node < cell.childNodes.length; node++) {
          if (cell.childNodes[node].nodeType === 3) raw += cell.childNodes[node].textContent;
        }
        var value = parseInt(raw.trim(), 10);
        if (isNaN(value)) continue;
        cell.classList.add("score", "score-" + band(value));
        cell.setAttribute("data-score", String(value));
        if (cell.querySelector(".score-bar")) continue;
        var scoreBar = document.createElement("span");
        scoreBar.className = "score-bar";
        scoreBar.setAttribute("aria-hidden", "true");
        var fill = document.createElement("span");
        fill.style.width = Math.max(0, Math.min(10, value)) * 10 + "%";
        scoreBar.appendChild(fill);
        cell.appendChild(scoreBar);
      }
    }
  }

  var bodies = document.querySelectorAll(".edition-body");
  for (var b = 0; b < bodies.length; b++) enhance(bodies[b]);
})();
