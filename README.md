# Unbiased News Feed

A daily edition of the five top UK stories, and how the world's media framed each one.

Published with GitHub Pages from the `main` branch (root).

**Site:** https://natter.tv/

## Add an edition

Drop one Markdown file into `_posts/`:

`_posts/YYYY-MM-DD-edition.md`

```yaml
---
title: "Unbiased News Feed, 7 October 2026"
date: 2026-10-07
---
```

Write the edition under that front matter. Leave out a top-level `#` heading; the title above is the page heading. In the ranking table, head the second column `UK prominence`, not Score. Commit the file to `main`. The newest file becomes the homepage, and every edition stays up at `/YYYY/MM/DD/`.

The site is served from the custom domain `https://natter.tv` with no subpath, so an edition dated 7 October 2026 is `https://natter.tv/2026/10/07/`.

## GitHub Pages

Settings → Pages → Build and deployment → **Deploy from a branch** → Branch: `main`, folder: `/` (root). The custom domain is `natter.tv` (see `CNAME`). `url` in `_config.yml` is `https://natter.tv` and `baseurl` is empty, so CSS, assets, edition permalinks, the archive, and the feed are served from the domain root.

## Local build

```bash
bundle install
bundle exec jekyll build
```
