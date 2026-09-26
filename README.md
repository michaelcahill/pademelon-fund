# Pademelon Fund

An Astro site supporting grassroots action for nature, First Nations and climate action across Australia, editable via
[PagesCMS](https://pagescms.dev).

## Development

```sh
npm install      # install dependencies
npm run dev      # start local dev server at http://localhost:4321
```

## Project Structure

```text
/
├── public/
│   └── images/          # PagesCMS media uploads + gallery folders
├── src/
│   ├── components/
│   │   ├── EntryHeader.astro   # Title / standfirst / date / hero image
│   │   ├── Footer.astro
│   │   ├── GalleryGrid.astro   # Responsive grid of gallery tiles
│   │   ├── Lightbox.astro      # glightbox setup (tap-to-zoom)
│   │   └── Nav.astro           # Header nav, collapses on narrow screens
│   ├── content/
│   │   ├── pages/       # Standalone pages (About, etc.)
│   │   └── news/        # Blog-style news posts
│   ├── layouts/
│   │   ├── BaseLayout.astro    # <html> shell, nav, footer; `wide` prop
│   │   ├── HomeLayout.astro    # Hero + CTA buttons + page sections
│   │   ├── PageLayout.astro    # Title + prose article
│   │   └── GalleryLayout.astro # Wide grid layout (pages and news items)
│   ├── lib/
│   │   ├── galleries.ts        # Lists images in a gallery folder
│   │   ├── layouts.ts          # Chooses a layout for an entry
│   │   ├── navigation.ts       # Shared nav items + active-link logic
│   │   └── paths.ts            # Base-path helper for GitHub Pages
│   ├── pages/
│   │   ├── index.astro          # Home page (HomeLayout)
│   │   ├── [...slug].astro      # Pages collection (page / home / gallery)
│   │   └── news/
│   │       ├── [slug].astro     # Individual news post (page or gallery)
│   │       └── index.astro      # News listing
│   └── styles/
│       └── global.css           # Tailwind v4 config + nav/prose styles
├── .pages.yml            # PagesCMS configuration
├── astro.config.mjs
└── package.json
```

## Layouts

| Layout | Use it for | Page width |
| :--- | :--- | :--- |
| `HomeLayout` | The home page: headline, standfirst, CTA buttons, optional hero image | standard |
| `PageLayout` | Ordinary pages and news posts with prose | standard |
| `GalleryLayout` | Pages and news items whose images live in a gallery folder | wide |

All three are built on `BaseLayout`, which owns `<html>`, the nav, the footer and
the page width. Pass `wide` to switch the whole shell (header and footer
included) from `max-w-4xl` to `max-w-7xl`.

Which layout an entry uses is decided by `pickLayout()` in `src/lib/layouts.ts`:

| `layout` frontmatter | Result |
| :--- | :--- |
| *(omitted)* or `auto` | Gallery when the image folder has images, otherwise a plain page |
| `page` | Always prose — never a gallery |
| `gallery` | Always the gallery layout (shows an empty state if there are no images) |
| `home` | The home hero layout |

## Galleries

A gallery is just a **folder of images** in `public/images/`. Nothing to
register: by convention an entry uses the folder named after it, so
`src/content/pages/impact.md` reads `public/images/impact/`.

- **Different folder?** Set `gallery:` in frontmatter — any directory under
  `public/images/` works, and several entries may share one
  (`gallery: about`).
- **Order:** images are sorted by filename using natural order, so prefix them
  (`01-arrival.jpg`, `02-camp.jpg`) to control the sequence.
- **Captions / alt text:** taken from the filename — `02-river-rest.jpg` becomes
  *"River rest"* and is used as alt text and as the lightbox caption.
- **Tile shape:** `galleryAspect` sets the CSS aspect-ratio of every tile
  (default `3/2`). Match it to your photos to avoid visible cropping; use `1/1`
  for squares or `16/9` for panoramas.
- **Gotcha:** an image folder named after a page turns that page into a gallery.
  If the folder holds logos or other art that must keep its own shape, opt out
  with `layout: page` (see `our-partners.md`).

Images are shown at their uploaded size — files in `public/` are not processed by
Astro's asset pipeline, so upload appropriately sized files (~1400px wide works
well) rather than full camera exports.

Tapping an image opens the [glightbox](https://biigbooks.github.io/GLightbox/)
lightbox: swipe or arrow keys to move between images of the same gallery, Escape
or a click outside to close. The lightbox script (~15KB gzipped) is only loaded
on pages that render a gallery; its stylesheet also ships with any page built
from `src/pages/[...slug].astro`.

## Responsive behaviour

- The menu collapses into a dropdown below `52rem` (the breakpoint is
  `--breakpoint-nav` in `src/styles/global.css`, mirrored in the nav CSS and
  script). Tap targets are at least 44px.
- Without JavaScript the menu stays expanded as a list and the toggle button is
  hidden, so the navigation never depends on JS.
- Uses `dvh` rather than `100vh`, plus `viewport-fit=cover` and safe-area
  padding, so the sticky header behaves on iPhone with a notch.
- Long code blocks and tables scroll inside their own box instead of pushing the
  page sideways.

## Styling notes

Tailwind CSS v4 is configured **from CSS** (`src/styles/global.css`) — plugins
are loaded there with `@plugin "@tailwindcss/typography";`. A
`tailwind.config.mjs` file is *not* read by `@tailwindcss/vite`, so the old one
was removed; anything custom belongs in `global.css` (`@theme`, `@utility`).

## Adding Content

Content is managed through [PagesCMS](https://pagescms.dev). The site uses two
content collections:

- **pages** — standalone pages like "Impact" (rendered at `/<slug>`)
- **news** — blog-style posts (rendered at `/news/<slug>`)

To add content locally, create `.md` files in `src/content/pages/` or
`src/content/news/` with frontmatter matching the collection schema (see
`src/content.config.ts`).

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys to GitHub Pages.

## Commands

| Command                   | Action                                           |
| :-----------------------: | ------------------------------------------------ |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Builds production site to `./dist/`              |
| `npm run preview`         | Preview production build locally                 |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
