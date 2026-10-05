# Image size audit — `public/images/`

Measured against how the site actually displays images (Astro copies `public/` to
`dist/` verbatim, so nothing is optimised at build time — a static resize is the only lever).

## The width that matters

The page shell is capped at `max-w-4xl` (56rem = 896px) with `px-8` padding
(`SHELL_CONTAINER`, `src/lib/shell.ts`), so content measures **832 CSS px** wide on a
desktop. A hero spans all three columns (`FULL_WIDTH`), so 832 CSS px is the widest any
image is ever displayed. On a 2× (Retina) screen that is **1664 physical pixels** — the
target width for anything used as a hero.

| Context | Where | Displayed CSS width | Source needed at 2× |
| --- | --- | --- | --- |
| Hero | `HomeLayout` (`w-full aspect-[16/9]`), `EntryHeader` (`w-full aspect-[3/2]`) | 832px | **1664px** |
| Impact card image | `src/pages/impact/index.astro` — `aspect-[16/9] w-full`, 2-up, `gap-6` | 404px | 808px |
| People portrait | `PeopleGrid.astro` — `aspect-square w-full`, 2-up | 404px | 808px |
| Gallery tile (3-up at `md`) | `GalleryGrid.astro` — `grid-cols-2 md:grid-cols-3`, `gap-4` | 267px | 534px |
| Partner logo | `partners.astro` — `h-20 w-full object-contain` | 80px tall | ≥160px tall |
| Pademelon watermark | `BaseLayout.astro` — Alpine sets width to column 1 (≈261 CSS px) | ~261px | 522px |

The lightbox (`Lightbox.astro`, glightbox) loads the tile's `href` — the same file, no
srcset — so a gallery photo is shown at its native size, capped by the viewport. A
1664-wide source fills a 1920px window comfortably; it is the size that keeps both the
hero and the lightbox sharp.

## Verdicts

**Scale to 1664 wide — no visible change.** Every camera original (4032×3024,
3024×4032, 2654×3540): 19 files, 24.2 MB → 16.0 MB (`scripts/resize-images.sh`). At the
hero box itself the mean per-channel difference vs a lossless resize is ~3–4/255 — JPEG
re-encode noise, no geometry change.

**Keep the width, re-encode only.** Already at or below 1664: `IMG_alpine.jpg` (home
hero, 1600), `WhatsApp Image …jpeg` (about hero, 1600), `michael-cahill.jpg` (1087),
the four unreferenced 1280 JPEGs, `still life in desert.jpeg` (960). Re-encoding at
quality 82 halves their bytes without touching pixels (RMSE 2–6/255).

**Never scale.** `pademelon-outline.png` (229×442) is drawn ~261 CSS px wide × 2 = 522px,
so it is already upscaled — shrinking blurs the watermark. `philanthropy-aus.png` (100px
tall) is shown in an 80 CSS px box = 160 device px, also already short.
`rachel-honnery.jpg` (800²) sits exactly on the portrait limit. `IMG_flowers.jpg`
(441×385) is below the impact card's 808px need and is upscaled today — there is no larger
copy of that photo, so it cannot be improved by resizing. The transparent
PNGs (`pademelon-outline.png`, `pademelon-logo-small.png`, `favicon.png`) must stay PNG —
they are line art, and JPEG destroys the alpha (RMSE 24–33/255).

**Format change, biggest single wins — done.** `IMG_flowers.png` (294 KB) and
`rachel-honnery.png` (627 KB) were fully-opaque photos in a PNG wrapper (alpha min 255 on
every pixel), so they became JPEGs at the same dimensions: 32 KB and 62 KB, RMSE 3.6 and
2.09 / 255 against the PNG. The frontmatter that pointed at `IMG_flowers.png` now points at
the `.jpg`; the portrait needs no frontmatter because `PORTRAIT_EXT` in `src/lib/people.ts`
lists `.jpg` first, and the `.png` was deleted so there is no ambiguity.

**Duplicates — done.** `IMG_pademelon.jpg` ≡ `pademelon_photos/IMG_pademelon.jpg` and
`IMG_R&M mountain.jpg` ≡ `pademelon_photos/IMG_R&M mountain.jpg` (identical md5) — 2.9 MB
of pure duplication. The **top-level** copies are the ones kept: frontmatter heroes live at
`/images/<file>` and galleries live in folders, so removing the folder copies keeps a hero
from being repeated as a gallery tile on the same page.

**Currently rendered nowhere.** `pademelon_photos/` (17 files, 21 MB) matches no entry
slug and no `gallery:` field, so it is the "future gallery": wiring it up needs only
`gallery: pademelon_photos` in frontmatter. Also unreferenced: `About page photo.jpeg`,
`Cradlemountain.jpeg`, `McDonnell Ranges.jpeg`, `still life in desert.jpeg`,
`pademelon-logo.png`. `public/images/about/` is empty while
`src/content/impact/welcome-to-pademelon-fund.md` sets `gallery: about`, so that post
renders the "no images in this gallery yet" notice today.

## Running the resize

```bash
scripts/resize-images.sh          # dry run — prints the plan, writes nothing
scripts/resize-images.sh --apply  # scales in place; originals kept in scripts/.pre-resize-backup
```

The script caps **width** (`-resize 1664x`), not the long edge: portrait originals are
stored rotated (EXIF Orientation 6 on 12 of them), and `-auto-orient` bakes that rotation
into the pixels before `-strip` removes the metadata, so they look exactly as they do now.
Capping by long edge would leave portrait photos 1248 wide — soft in a Retina hero.
Filenames are unchanged, so frontmatter paths and Pages CMS media references keep working.
Backups mirror the `public/images` tree and live **outside** `public/`: Astro copies
everything under `public/` into `dist`, so a backup folder there ships the originals.

Gallery-only folders can go smaller (tiles need ~534px): `pademelon_photos/` at 1280 is
5.4 MB, versus 9.7 MB at 1664 — the saving costs nothing on screen for tiles, but the
lightbox loses headroom.

## Applied (2026-10-05)

**Scale-down.** 26 JPEGs changed: 19 scaled to 1664 wide, 7 re-encoded at width ≤ 1664 with
pixels untouched. `public/images` 30 MB → 20 MB, `dist/images` 38 MB → 20 MB.

**Dedupe + format.** Two duplicate JPEGs removed from `pademelon_photos/`, and the two
opaque photo PNGs converted to JPEG (924 KB of PNG → 94 KB). `public/images` is now 17 MB
(from 30 MB), and `dist/images` matches it.
Four filenames changed, so one frontmatter path was edited (`IMG_flowers.jpg`) and one
portrait resolves by convention (`people/rachel-honnery.jpg`).

Checked after applying:

- Every file compared against the **browser view of the original** (EXIF rotation applied):
  mean per-channel RMSE 0.97–4.24 / 255, nothing above 8 — rotation and framing preserved,
  only re-encode noise.
- Widest JPEG in `public/images` is now 1664px, so no hero is upscaled beyond Retina size.
- `npm run build` clean (9 pages); every `src` in the built HTML points at a file that
  exists — home `IMG_alpine.jpg`, about `About page photo.jpeg`, contact
  `IMG_R&M mountain.jpg`, impact cards `IMG_pademelon.jpg` / `IMG_flowers.jpg`, portraits
  `people/michael-cahill.jpg` / `people/rachel-honnery.jpg`.
- Preview server served the new bytes: home hero 442 KB, about hero 347 KB, contact hero
  586 KB (were 873 / 525 / 1618 KB), and `dist` contains no backup folder.

Delete `scripts/.pre-resize-backup/` once the pages have been eyeballed on a Retina screen.
