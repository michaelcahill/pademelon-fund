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
│   ├── images/          # PagesCMS image uploads + gallery folders
│   └── documents/       # PagesCMS document uploads (PDFs, CSVs, decks…)
├── src/
│   ├── components/
│   │   ├── EntryHeader.astro   # Title / standfirst / date / hero image
│   │   ├── Footer.astro
│   │   ├── GalleryGrid.astro   # Responsive grid of gallery tiles
│   │   ├── Lightbox.astro      # glightbox setup (tap-to-zoom)
│   │   ├── Nav.astro           # Header nav, collapses on narrow screens
│   │   └── PeopleGrid.astro    # Cards for the people collection
│   ├── content/
│   │   ├── pages/       # Standalone pages (About, People, etc.)
│   │   ├── people/      # One file per person (card bio)
│   │   ├── partners/    # Partner organisations
│   │   └── impact/      # Blog-style impact posts
│   ├── layouts/
│   │   ├── BaseLayout.astro    # <html> shell, nav, footer (uniform width)
│   │   ├── HomeLayout.astro    # Hero + CTA buttons + page sections
│   │   ├── PageLayout.astro    # Title + prose article
│   │   └── GalleryLayout.astro # Grid layout (pages and news items)
│   ├── lib/
│   │   ├── cards.ts            # Splits a page at its `<!-- cards -->` marker
│   │   ├── galleries.ts        # Lists images in a gallery folder
│   │   ├── layouts.ts          # Chooses a layout for an entry
│   │   ├── navigation.ts       # Shared nav items + active-link logic
│   │   ├── people.ts           # People listing + portrait lookup
│   │   ├── paths.ts            # Base-path helper for GitHub Pages
│   │   └── shell.ts            # Shared page-width + prose constants
│   ├── pages/
│   │   ├── index.astro          # Home page (HomeLayout)
│   │   ├── [...slug].astro      # Pages collection (page / home / gallery)
│   │   ├── founders.astro       # Redirect stub: /founders moved to /people
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

| Layout | Use it for |
| :--- | :--- |
| `HomeLayout` | The home page: headline, standfirst, CTA buttons, optional hero image |
| `PageLayout` | Ordinary pages and news posts with prose |
| `GalleryLayout` | Pages and news items whose images live in a gallery folder |

All three are built on `BaseLayout`, which owns `<html>`, the nav and the footer.
Every page uses one shell width — `SHELL_CONTAINER` in `src/lib/shell.ts`
(`max-w-4xl`) — applied to the header, main and footer, so the nav bar never
changes width as you navigate. There is no `wide` option: gallery grids get their
impact from tiles inside the standard shell rather than a wider document.

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
  with `layout: page` (see `partners.md`).

Images are shown at their uploaded size — files in `public/` are not processed by
Astro's asset pipeline, so upload appropriately sized files (~1400px wide works
well) rather than full camera exports.

Tapping an image opens the [glightbox](https://biigbooks.github.io/GLightbox/)
lightbox: swipe or arrow keys to move between images of the same gallery, Escape
or a click outside to close. The lightbox script (~15KB gzipped) is only loaded
on pages that render a gallery; its stylesheet also ships with any page built
from `src/pages/[...slug].astro`.

## Documents and downloads

Static files — PDFs, spreadsheets, slide decks, ZIPs — are uploaded to
`public/documents/` and served verbatim at `/documents/…`. There is nothing to
register: PagesCMS writes the file into the folder (the **Documents** media
source in `.pages.yml`) and Astro copies it into `dist/` on build.

Link one from any page or impact body:

```markdown
[Annual report 2026](/documents/annual-report-2026.pdf)
```

All of these resolve to the same file, which keeps copy-pasted paths and
filename-only links working:

| Written in markdown                              | Rendered href                          |
| :----------------------------------------------- | :------------------------------------- |
| `/documents/annual-report-2026.pdf`              | `/documents/annual-report-2026.pdf`    |
| `annual-report-2026.pdf`                         | `/documents/annual-report-2026.pdf`    |
| `documents/annual-report-2026.pdf`               | `/documents/annual-report-2026.pdf`    |
| `public/documents/annual-report-2026.pdf`        | `/documents/annual-report-2026.pdf`    |
| `grant-rounds/rules.pdf` (sub-folder)            | `/documents/grant-rounds/rules.pdf`    |

The rewrite happens in `prefixContentPaths()` in `astro.config.mjs`, which also
adds the base path to site-absolute `src`/`href` values in markdown (Astro does
not touch those itself). Rules worth knowing:

- The shorthand only applies to known document extensions and only when the
  file actually exists — a typo stays a broken relative link rather than being
  silently rewritten, so double-check new links in the preview.
- Absolute (`/…`), external (`https://…`), `mailto:`/`tel:` and `#anchor` links
  are left exactly as written.
- Uploads are renamed to URL-safe names by PagesCMS (`rename: safe`), so spaces
  and accents never end up in a link.
- Files are served as-is, like everything in `public/`: no compression, and the
  browser shows PDFs inline. A link opens the file; hold Option/right-click to
  save it.

## Responsive behaviour

- The menu collapses into a dropdown below `52rem`. The breakpoint is defined once
  as `--breakpoint-nav` in `src/styles/global.css`; the nav script reads it from
  CSS, and the one `@media` rule that needs it repeats the literal (CSS custom
  properties can't be used inside `@media`). Tap targets are at least 44px.
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

Content is managed through [PagesCMS](https://pagescms.dev). The site uses four
content collections:

- **pages** — standalone pages like "About" and "People" (rendered at `/<slug>`)
- **people** — one file per person; their markdown body becomes a card on
  `/people` (see below)
- **partners** — organisations listed on `/partners`
- **impact** — blog-style posts (rendered at `/impact/<slug>`)

To add content locally, create `.md` files in the collection's folder with
frontmatter matching the schema in `src/content.config.ts`.

## People cards

`/people` is still an ordinary markdown page: `cards: people` in its frontmatter
asks for one card per file in `src/content/people/`, and a marker on a line of
its own says **where** they go — so text can sit above and below them:

```markdown
Intro paragraph, shown above the cards.

<!-- cards -->

Closing paragraph, shown below the cards.
```

The marker is removed from the rendered page; only the first one is used. Write
`{{cards}}` instead if your editor strips HTML comments. With no marker at all the
cards follow the page text, as they did before placement existed.

A new person is a new markdown file — no component work, no HTML:

```markdown
---
name: Jane Doe
role: Advisor
order: 3
---
Jane Doe …bio paragraph…
```

The portrait follows the gallery convention: drop
`public/images/people/jane-doe.jpg` (matching the filename) and it is picked up
automatically, or set `image:` explicitly. Bios are plain prose — paragraphs,
lists and links work; keep headings out, as the card supplies the name.

Because a portrait folder exists, `/people` sets `layout: page` so the images do
not turn the page into a gallery (see `pickLayout()`).

Mechanics: `splitAtCards()` in `src/lib/cards.ts` splits the page's rendered HTML
at the marker. The first half renders in `PageLayout`'s prose block, the grid goes
in its `after` slot — outside `.prose`, so the typography plugin cannot put its 2em
image margins around each portrait — and the second half follows in a wrapper using
the same `PROSE_CLASS` constant, which is why the two halves look identical.

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
