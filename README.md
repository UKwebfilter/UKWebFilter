# Unbiased News Feed

A daily edition of the five top UK stories, and how the world's media framed each one.

Published with GitHub Pages from the `main` branch (root).

**Site:** https://ukwebfilter.github.io/UKWebFilter/

## Add an edition

Drop one Markdown file into `_posts/`:

`_posts/YYYY-MM-DD-edition.md`

```yaml
---
title: "Unbiased News Feed, 7 October 2026"
date: 2026-10-07
---
```

Write the edition under that front matter. Leave out a top-level `#` heading; the title above is the page heading. Commit the file to `main`. The newest file becomes the homepage, and every edition stays up at `/YYYY/MM/DD/`.

## GitHub Pages

Settings → Pages → Build and deployment → **Deploy from a branch** → Branch: `main`, folder: `/` (root). `baseurl` in `_config.yml` is `/UKWebFilter`.

## Local build

```bash
bundle install
bundle exec jekyll build
```
