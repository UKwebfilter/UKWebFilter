---
layout: page
title: How it works
permalink: /how-it-works/
description: How Natter scores UK prominence, Bias Spread, and Focus, and which outlets sit on the standing panel.
---

Natter lines up the morning’s UK stories and how a standing panel of outlets framed each one. The scores describe the coverage. They do not pick a winner.

## UK prominence

The ranking table orders stories by how widely they led the British outlets on the panel. An outlet’s lead story is worth 2 points. A story in that outlet’s top three is worth 1. The points are added across the UK outlets. A high number means the story dominated those front pages.

## Bias Spread

Bias Spread is a score from 1 to 10 for the story as a whole. A 1 means near-identical framing across outlets. A 10 means sharply divergent framing. It is not a verdict on which outlet is right.

The number is a heat chip in the ranking table and again on the line under each story. Cool is low. Hot is high.

<p class="heat-scale" aria-label="Heat scale from low to high">
  <span class="score-heat heat-1">1–3</span>
  <span class="score-heat heat-2">4–5</span>
  <span class="score-heat heat-3">6–7</span>
  <span class="score-heat heat-4">8–10</span>
</p>

In the edition, write the line as `Bias Spread: 7/10`. The page colours that score.

## Focus

Focus is the same 1–10 heat scale for a single outlet, on that outlet’s line in “How it was framed”. A low Focus stays with the facts and wording the outlets share. A high Focus leads on one contested frame. Two outlets can both score high and still point the frame in opposite directions.

Write the marker after the outlet’s context, as `Focus 4/10` or `Focus 4`:

```markdown
- [BBC](https://www.bbc.co.uk/) (UK, public-service) Focus 2/10 keeps to the wording outlets share.
```

The edition script turns that token into a pill. The same pill can be written in HTML when it should be in the page before the script runs:

<ul class="framed-list">
  <li class="outlet-row">
    <img class="outlet-logo" src="{{ '/assets/logos/bbc.png' | relative_url }}" width="18" height="18" alt="" data-letter="B" data-color="#111111">
    <a href="https://www.bbc.co.uk/">BBC</a>
    <span class="outlet-ctx">(UK, public-service)</span>
    <span class="focus-pill heat-1" title="Focus 2/10">Focus 2</span>
    keeps to the wording outlets share.
  </li>
</ul>

<p class="heat-scale" aria-label="Focus pills on the heat scale">
  <span class="focus-pill heat-1" title="Focus 2/10">Focus 2</span>
  <span class="focus-pill heat-2" title="Focus 4/10">Focus 4</span>
  <span class="focus-pill heat-3" title="Focus 7/10">Focus 7</span>
  <span class="focus-pill heat-4" title="Focus 8/10">Focus 8</span>
</p>

## Standing outlet panel

Every edition is scored against the same panel, so one morning can be compared with the next. UK prominence uses the British outlets. The framing list quotes the panel outlets that covered the story, which is why a given day does not mention every name below.

Logos are small favicon-style marks stored in `assets/logos/`.

{% include panel.html %}
