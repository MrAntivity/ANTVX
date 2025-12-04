# ANTVX Studios Landing Page

This repository contains the ANTVX Studios marketing site.

## Local preview
Open `index.html` in a browser or use a simple server:

```bash
python -m http.server 8000
```

## GitHub Pages hosting
A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes the site whenever you push to the `main` or `work` branch.

To enable hosting:
1. Merge your changes to one of those branches on GitHub.
2. In **Settings → Pages**, choose **Deploy from a branch** with the **GitHub Actions** source.
3. The `Deploy static site to GitHub Pages` workflow will build and deploy to the `github-pages` environment; the run summary shows the live URL.

If Pages is not serving the site, confirm the workflow succeeded and that Pages is enabled in the repo settings.
