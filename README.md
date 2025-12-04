# ANTVX Studios Landing Page

This repository contains the ANTVX Studios marketing site.

## Local preview
Open `index.html` in a browser or use a simple server:

```bash
python -m http.server 8000
```

## GitHub Pages hosting
A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes the site whenever you push to the `main` or `work` branches. It also enables GitHub Pages automatically through `actions/configure-pages` using the default `GITHUB_TOKEN`.

To host the site on GitHub Pages:
1. Merge your changes to `main` or `work` and wait for the **Deploy static site to GitHub Pages** workflow to finish.
2. In **Settings → Pages**, confirm the source is **GitHub Actions** (the workflow sets this automatically). The run summary in the `github-pages` environment lists the live URL.
3. If deployment fails, ensure the repository allows GitHub Pages and that the `GITHUB_TOKEN` has `pages:write` permissions (required for private repositories or restricted organizations).
