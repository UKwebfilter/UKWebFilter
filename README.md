# Natter

How the world reported today’s UK news.

A morning edition of the top UK stories: how widely British outlets led on each one, how far the world’s framing spread, and — when an edition includes them — a Focus score for each outlet.

Published with GitHub Pages from the `main` branch (root).

**Site:** https://natter.tv/

`url` in `_config.yml` is `https://natter.tv` and `baseurl` is empty. `CNAME` is `natter.tv`. CSS, logos, edition permalinks, and the feed are served from the domain root. Do not set a project subpath.

## Add an edition

Drop one Markdown file into `_posts/`:

`_posts/YYYY-MM-DD-edition.md`

```yaml
---
title: "7 October 2026"
date: 2026-10-07
---
```

Leave out a top-level `#` heading. The page heading is the edition date. Commit the file to `main`. The newest file becomes the homepage, and every edition stays up at `/YYYY/MM/DD/`.

An edition dated 7 October 2026 is `https://natter.tv/2026/10/07/`.

Start the body with the ranking table. Do not put a Bias Spread definition above it. That explanation lives on [How it works](/how-it-works/).

```markdown
| Story | UK prominence | Bias Spread | Lead story at | Top 3 at |
|---|---|---|---|---|
| Example story | 8 | 7 | BBC, Sky | Mail, Sun |
```

UK prominence is 2 points for an outlet’s lead and 1 for its top three, summed across the UK outlets on the standing panel. Bias Spread is an integer from 1 to 10. The page draws it as a heat chip: 1–3 green, 4–5 yellow, 6–7 orange, 8–10 red.

Under each story, keep the spread on its own line:

```markdown
**Bias Spread: 7/10.** What the outlets agree on, and where they split.
```

### Focus markers

In a “How it was framed” list, write the score after the outlet’s context:

```markdown
**How it was framed**
- [BBC](https://www.bbc.co.uk/example) (UK, public-service) Focus 2/10 keeps to the wording outlets share.
```

`Focus 2/10` and `Focus 2` both work. `assets/js/edition.js` turns the token into a pill on the same heat scale and adds the outlet’s logo from `assets/logos/`. The script only does this inside a list that follows a **How it was framed** line, so story prose is left alone.

The HTML equivalent, if a pill must be present before the script runs:

```html
<span class="focus-pill heat-1" title="Focus 2/10">Focus 2</span>
```

`heat-1` is 1–3, `heat-2` is 4–5, `heat-3` is 6–7, `heat-4` is 8–10.

Outlets the script can mark are listed in `_data/outlets.yml`. Link the outlet’s own story URL. The logo is chosen from the hostname, then from the link text. Logos are small favicons saved in the repo (the outlet’s own icon, or Google’s public favicon service when the site icon would not load). A letter mark is drawn in the browser if the file fails.

### Trends

[/trends/](/trends/) plots the average Bias Spread for each edition. By default it reads every `Bias Spread: n/10` line in the edition. To override that parse, set front matter:

```yaml
bias_spreads:
  - 7
  - 6
  - 3
```

The chart grows by one bar per edition that has those scores. With no scores yet, the page shows a labelled sample chart.

## Newsletter

The footer form is markup for [Buttondown](https://buttondown.com/)’s free plan. No paid service is wired up. The form posts an `email` field and a hidden `embed=1`, which is the classic embed body.

Until the action URL is set, `newsletter_action` is `#` and the form does not submit.

Set the public embed URL in `_config.yml` (it is not an API key):

```yaml
newsletter_action: "https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
```

GitHub Pages builds from that file. The `github-pages` gem runs in safe mode, so the URL cannot be injected from an environment variable during the build. To try a different URL locally without committing it, add a gitignored `_config.local.yml`:

```yaml
newsletter_action: "https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
```

```bash
bundle exec jekyll build --config _config.yml,_config.local.yml
```

## GitHub Pages

Settings → Pages → Build and deployment → **Deploy from a branch** → Branch: `main`, folder: `/` (root). The custom domain is `natter.tv` (see `CNAME`).

## Local build

```bash
bundle install
bundle exec jekyll build
```

The built files are in `_site/`. Stylesheet and logos are rooted at `/assets/…`.
