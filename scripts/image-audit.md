# Image size audit — `src/assets/images/`

Photos live in `src/assets/images/`, so Astro's image service (`sharp`) resizes them at
build time: `<Image>` writes a `srcset` of WebP renditions at the widths each context
displays at, and `photoFor()` in `src/lib/photos.ts` resolves the `/images/<file>` paths
that frontmatter and the CMS write. Measured against how the site displays images.

The static resize (`scripts/resize-images.sh`) is still the lever for **source quality**:
Astro scales down from whatever is uploaded, so a 4032px original re-encoded at quality 82
gives it better pixels to work with than a raw camera file, and the source tree stays small.

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
| Pademelon watermark | `Watermark.astro` — the script sets width to column 1 (≈261 CSS px) | ~261px | 522px |

The lightbox (`Lightbox.astro`, glightbox) loads the tile's `href` — the same file, no
srcset — so a gallery photo is shown at its native size, capped by the viewport. A
1664-wide source fills a 1920px window comfortably; it is the size that keeps both the
hero and the lightbox sharp.

## Verdicts

**Scale to 1664 wide — no visible change.** Every camera original (4032×3024,
3024×4032, 2654×3540): 19 files, 24.2 MB → 16.0 MB (`scripts/resize-images.sh`). At the
hero box itself the mean per-channel difference vs a lossless resize is ~3–4/255 — JPEG
re-encode noise, no geometry change.

**Keep the width, re-encode only.** Already at or below 1664: `alpine.jpg` (home hero,
1600), `michael-cahill.jpg` (1087), the unreferenced 1280 JPEGs
(`about-page-photo.jpeg`, `cradlemountain.jpeg`, `mcdonnell-ranges.jpeg`) and
`still-life-in-desert.jpeg` (960). Re-encoding at quality 82 halves their bytes without
touching pixels (RMSE 2–6/255).

**Never scale.** `pademelon-outline.png` (229×442) is drawn ~261 CSS px wide × 2 = 522px,
so it is already upscaled — shrinking blurs the watermark. `philanthropy-aus.png` (100px
tall) is shown in an 80 CSS px box = 160 device px, also already short.
`rachel-honnery.jpg` (800²) sits exactly on the portrait limit. `flowers.jpg`
(441×385) is below the impact card's 808px need and is upscaled today — there is no larger
copy of that photo, so it cannot be improved by resizing. The transparent
PNGs (`pademelon-outline.png`, `pademelon-logo-small.png`, `favicon.png`) must stay PNG —
they are line art, and JPEG destroys the alpha (RMSE 24–33/255).

**Format change, biggest single wins — done.** The flowers photo (294 KB) and Rachel's
portrait (627 KB) were fully-opaque photos in a PNG wrapper (alpha min 255 on every pixel),
so they became JPEGs at the same dimensions: 32 KB and 62 KB, RMSE 3.6 and 2.09 / 255
against the PNG. The portrait needs no frontmatter because `PORTRAIT_EXT` in
`src/lib/people.ts` lists `.jpg` first, and the `.png` was deleted so there is no ambiguity.

**Duplicates — done.** The pademelon and mountain photos existed twice (identical md5) —
once at top level as a hero, once inside the photo folder. The **top-level** copies are the
ones kept: frontmatter heroes live at `/images/<file>` and galleries live in folders, so
dropping the folder copies keeps a hero from being repeated as a gallery tile on the same page.

**Currently rendered nowhere.** `pademelon-photos/` (15 files) matches no entry slug and no
`gallery:` field, so it is the "future gallery": wiring it up needs only
`gallery: pademelon-photos` in frontmatter. Also unreferenced: `cradlemountain.jpeg`,
`mcdonnell-ranges.jpeg`, `still-life-in-desert.jpeg`, `pademelon-logo.png`.
`src/assets/images/about/` is empty while
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
Filenames are unchanged by the resize, so frontmatter paths and Pages CMS media references
keep working. Backups mirror the `src/assets/images` tree and live **outside** it
(`scripts/.pre-resize-backup`): `photoFor()` globs every photo under `src/assets/images`,
so a `.bak` copy in that tree would be treated as a picture.

Gallery-only folders can go smaller (tiles need ~534px): `pademelon-photos/` at 1280 is
5.4 MB, versus 9.7 MB at 1664 — the saving costs nothing on screen for tiles, but the
lightbox loses headroom.

## Renaming pass

`scripts/rename-images.sh` renames every photo to a URL-friendly slug: drop the `IMG_`
prefix, spaces and underscores → dashes, all lowercase. It uses `git mv`, refuses to
clobber an existing name, and is idempotent (a re-run reports "already renamed").

- `IMG_R&M mountain.jpg` → `r-and-m-mountain.jpg`. The `&` is the one character worth
  removing: it survives in a URL path, but HTML has to escape it (`src="/images/IMG_R&amp;M
  mountain.jpg"`), which is exactly the kind of thing that breaks when a path is copied
  between frontmatter, the CMS and a browser.
- `Cradlemountain.jpeg` → `cradlemountain.jpeg` is a case-only rename, invisible on the
  case-insensitive macOS filesystem: `git mv` sees a collision, so the script goes through
  a temporary name.
- The gallery folder follows the same rule: `pademelon_photos/` → `pademelon-photos/`.
  Nothing referenced it, and `titleFromFilename()` in `src/lib/photos.ts` turns dashes
  back into spaces, so tiles read "Evening treecover" rather than "IMG_evening treecover".

Pages CMS uploads keep their original names (`input: src/assets/images`), so a future upload
can reintroduce a space or an `IMG_` prefix. Re-run the script, then update any frontmatter
that pointed at a renamed file.

## Applied (2026-10-05)

**Scale-down.** 26 JPEGs changed: 19 scaled to 1664 wide, 7 re-encoded at width ≤ 1664 with
pixels untouched. `src/assets/images` 30 MB → 20 MB, `dist/images` 38 MB → 20 MB.

**Dedupe + format.** Two duplicate JPEGs removed from the photo folder, and the two opaque
photo PNGs converted to JPEG (924 KB of PNG → 94 KB). `src/assets/images` is now 17 MB
(from 30 MB), and `dist/images` matches it. One frontmatter path was edited (`flowers.jpg`);
the portrait resolves by convention (`people/rachel-honnery.jpg`).

**Rename.** 23 files + the photo folder renamed (see "Renaming pass"), with five frontmatter
paths updated: home `alpine.jpg`, about `about-page-photo.jpeg`, contact
`r-and-m-mountain.jpg`, impact cards `pademelon.jpg` / `flowers.jpg`.

Checked after applying:

- Every file compared against the **browser view of the original** (EXIF rotation applied):
  mean per-channel RMSE 0.97–4.24 / 255, nothing above 8 — rotation and framing preserved,
  only re-encode noise.
- Widest JPEG in `src/assets/images` is now 1664px, so no hero is upscaled beyond Retina size.
- `npm run build` clean (9 pages); every `src` in the built HTML points at a file that
  exists — home `alpine.jpg`, about `about-page-photo.jpeg`, contact
  `r-and-m-mountain.jpg`, impact cards `pademelon.jpg` / `flowers.jpg`, portraits
  `people/michael-cahill.jpg` / `people/rachel-honnery.jpg`, and the chrome images
  `pademelon-logo-small.png` / `pademelon-outline.png`.
- Preview server served the new bytes: home hero 442 KB, about hero 347 KB, contact hero
  586 KB (were 873 / 525 / 1618 KB), and `dist` contains no backup folder.

Delete `scripts/.pre-resize-backup/` once the pages have been eyeballed on a Retina screen.
