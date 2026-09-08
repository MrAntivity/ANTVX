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

## Scroll hero redesign

The site remains plain HTML, CSS, and JavaScript with no build step or runtime dependencies. The home page has a sticky hero whose artwork expands with native scrolling. The opening headline fades into a second scene, and the world and team cards reveal as they enter the viewport.

Motion uses a single requestAnimationFrame update per scroll frame. Reduced-motion preferences disable the pinned sequence and reveals, and content stays visible when JavaScript is unavailable. All four world pages have matching navigation and footers, individual typographic posters and palettes, accessible development roadmaps, and the original game descriptions and links. The studio and each world credit Antivity, Starpuffle, Nqrwhql, and Aaron.

`assets/frontier.webp` is original AI-generated studio concept art, not a gameplay screenshot. Its source image was generated for this redesign and optimized to WebP (1672 × 941).

Before publishing, open the home page at desktop and phone sizes, scroll forward and backward through the hero, follow each world link, and check keyboard navigation and your system’s reduced-motion setting. Automated checks cover local links, JavaScript syntax, scroll progress and reversal, and motion preference changes; visual browser review is still needed.
