import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { basePath } from './paths';

/**
 * Photos live in `src/assets/images/`, not `public/images`.
 *
 * Files under `public/` are copied verbatim by Astro, so an uploaded 1664px JPEG is
 * served at full size to a phone showing it at 267 CSS px. Under `src/assets/`, the
 * same file goes through Astro's image service (sharp, already installed with Astro):
 * `<Image>` / `<Picture>` build a `srcset` of resized WebP renditions and set
 * `width`/`height` from the file's metadata, so a tile costs tens of kilobytes.
 *
 * Frontmatter and CMS values keep their site-absolute shape (`/images/x.jpg`) —
 * `photoFor` resolves them to the asset at build time. A gallery is still a folder:
 * drop photos in `src/assets/images/<slug>/` and they appear, filename order.
 */

/** Site-absolute prefix every photo path starts with. */
const PHOTOS = '/images';

const MODULES = import.meta.glob('../assets/images/**/*.{jpg,jpeg,png,webp,avif,gif,svg}', {
  eager: true,
}) as Record<string, { default: ImageMetadata }>;

/** `/images/people/rachel.jpg` → metadata, keyed case-insensitively. */
const byPath = new Map<string, ImageMetadata>();
/** Folder name (`people`, `impact/trip`, `''` for photos at the top level). */
const byFolder = new Map<string, { file: string; meta: ImageMetadata }[]>();

for (const [key, mod] of Object.entries(MODULES)) {
  // `../assets/images/people/rachel.jpg` → `/images/people/rachel.jpg`
  const sitePath = key.replace(/^\.\.\/assets\/images/, PHOTOS);
  byPath.set(sitePath.toLowerCase(), mod.default);

  const rest = sitePath.slice(PHOTOS.length + 1);
  const folder = rest.includes('/') ? rest.slice(0, rest.lastIndexOf('/')) : '';
  const file = rest.includes('/') ? rest.slice(rest.lastIndexOf('/') + 1) : rest;
  const list = byFolder.get(folder) ?? [];
  list.push({ file, meta: mod.default });
  byFolder.set(folder, list);
}

/** `02-river-rest.jpg` → `River rest` */
function titleFromFilename(file: string): string {
  const stem = file
    .replace(/\.(jpe?g|png|webp|avif|gif|svg)$/i, '')
    // Drop numeric ordering prefixes such as `01-` or `1.2_`.
    .replace(/^[\d.\s]+[-_.]\s*/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stem) return '';
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

/** Parse captions from frontmatter.
 * Expected format (one per line): filename.jpg: Caption text.
 * Returns a map filename → caption.
 */
function parseCaptions(captions?: string | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!captions) return map;
  for (const line of captions.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const file = trimmed.slice(0, idx).trim();
    const caption = trimmed.slice(idx + 1).trim();
    if (file && caption) map[file] = caption;
  }
  return map;
}

export interface GalleryImage {
  /** Astro asset metadata — pass to `<Image>` / `image()`. */
  meta: ImageMetadata;
  /** Derived from the filename; used as alt text and lightbox caption. */
  alt: string;
  /** Original filename, handy for debugging. */
  file: string;
}

/**
 * Resolve a photo path written in content (frontmatter, CMS insert, markdown) to
 * its asset. Accepts `/images/x.jpg`, the base-prefixed form, a bare filename
 * inside `src/assets/images`, and `gallery`-style folder paths.
 *
 * Returns undefined for external URLs (`https://…`) and for names with no matching
 * file, so callers keep the string they were given — an editor can still point at
 * a photo hosted elsewhere.
 */
export function photoFor(pathname?: string | null): ImageMetadata | undefined {
  if (!pathname) return undefined;
  if (/^(https?:)?\/\//.test(pathname) || pathname.startsWith('data:')) return undefined;

  // Drop the deploy base path, then normalise to `/images/…`.
  let clean = pathname.split('?')[0];
  if (basePath && (clean === basePath || clean.startsWith(`${basePath}/`))) {
    clean = clean.slice(basePath.length);
  }
  if (!clean.startsWith(PHOTOS)) clean = `${PHOTOS}/${clean.replace(/^\/+/, '')}`;

  const direct = byPath.get(clean.toLowerCase());
  if (direct) return direct;

  // A name with no extension (`people/rachel-honnery`, or a bare `rachel.jpg`-style
  // stem) is matched against the photo tree: find the folder, then the file whose
  // stem matches, any extension.
  const rest = clean.slice(PHOTOS.length + 1);
  const folder = rest.includes('/') ? rest.slice(0, rest.lastIndexOf('/')) : '';
  const stem = rest.includes('/') ? rest.slice(rest.lastIndexOf('/') + 1) : rest;
  const list = byFolder.get(folder) ?? [];
  const found = list.find((entry) => entry.file.replace(/\.[^.]+$/, '').toLowerCase() === stem.toLowerCase());
  if (found) return found.meta;

  // A bare stem with no folder: search every folder.
  if (!rest.includes('/')) {
    for (const entries of byFolder.values()) {
      const match = entries.find((entry) => entry.file.replace(/\.[^.]+$/, '').toLowerCase() === stem.toLowerCase());
      if (match) return match.meta;
    }
  }
  return undefined;
}

/** The gallery folder an entry points at: its `gallery` field, else its slug. */
export function galleryFolderFor(data: { gallery?: string }, id: string): string {
  return data.gallery ?? id;
}

/**
 * Photos in a gallery folder, filename order (natural sort, so `2.jpg` precedes
 * `10.jpg`). Captions from frontmatter override the filename-derived alt text.
 *
 * Returns an empty array when the folder is missing, so a page can be published
 * before its photos are uploaded.
 */
export function galleryImages(
  folder?: string | null,
  captions?: string | null,
): GalleryImage[] {
  if (!folder) return [];

  // `gallery: ../../etc` cannot escape the photos tree.
  const key = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (key.split('/').some((part) => part === '..')) return [];

  const list = byFolder.get(key);
  if (!list) return [];

  const captionMap = parseCaptions(captions);

  return [...list]
    .sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true, sensitivity: 'base' }))
    .map(({ file, meta }) => ({
      meta,
      file,
      alt: captionMap[file] ?? titleFromFilename(file),
    }));
}

/** Convenience wrapper for listings that only need the count. */
export function countGalleryImages(folder?: string | null): number {
  return galleryImages(folder).length;
}

/** Portrait for a person: `image` frontmatter, else `photos/people/<slug>.<ext>`. */
export function portraitFor(data: { image?: string }, slug: string): ImageMetadata | undefined {
  if (data.image) return photoFor(data.image);
  const found = byFolder.get('people')?.find((entry) => {
    const stem = entry.file.replace(/\.(jpe?g|png|webp|avif|gif|svg)$/i, '');
    return stem === slug;
  });
  return found?.meta;
}

/**
 * Point photo references in rendered HTML at the build-time assets.
 *
 * The CMS inserts `/images/<file>` into page bodies and the Sätteri plugin base-prefixes
 * it, but files under `src/assets` are served from hashed URLs (`/_astro/hash.jpg`), so
 * a literal `/images/…` in a body would 404. This rewrites every `src`/`href` that names
 * a photo we know about; anything not found (an external URL, an unknown file) is left
 * exactly as written.
 */
export async function rewritePhotoPaths(html: string): Promise<string> {
  // Resolve every referenced photo once; a name with no asset (an external URL, an
  // unknown file) is left exactly as written.
  const refs = [...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]))]
    .filter((ref) => photoFor(ref));
  if (!refs.length) return html;

  const resolved = new Map<string, { best: string; srcset: string; full: string; width: number; height: number }>();
  await Promise.all(
    refs.map(async (ref) => {
      const meta = photoFor(ref)!;
      // Cap at the source width: asking for more would enlarge the photo.
      const widths = BODY_WIDTHS.map((w) => Math.min(w, meta.width));
      const renditions = await Promise.all(widths.map((w) => getImage({ src: meta, width: w, format: 'webp' })));
      resolved.set(ref, {
        best: renditions[renditions.length - 1].src,
        // `getImage` reports the requested width in `rawOptions`, so pair the rendition
        // with the width it was asked for.
        srcset: renditions
          .map((r, i) => `${r.src} ${r.rawOptions.width ?? widths[i]}w`)
          .join(', '),
        // A link to a photo opens the whole picture, so it points at the source size.
        full: (await getImage({ src: meta, width: meta.width, format: 'webp' })).src,
        width: meta.width,
        height: meta.height,
      });
    }),
  );

  const out = html.replace(/href="([^"]+)"/g, (match, ref: string) => {
    const r = resolved.get(ref);
    return r ? `href="${r.full}"` : match;
  });

  return out.replace(/<img\b[^>]*>/g, (tag) => {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    const r = src && resolved.get(src);
    if (!r) return tag;

    // What content wrote is kept (alt, class, an explicit loading choice); Astro adds
    // the srcset and the intrinsic size, which reserves the space so a body photo
    // cannot shift the text below it while it loads.
    const attrs = [
      `src="${r.best}"`,
      `srcset="${r.srcset}"`,
      `width="${r.width}"`,
      `height="${r.height}"`,
    ];
    for (const [, name, value] of tag.matchAll(/\b([a-zA-Z-]+)="([^"]*)"/g)) {
      if (name !== 'src' && !attrs.some((a) => a.startsWith(`${name}=`))) {
        attrs.push(`${name}="${value}"`);
      }
    }
    if (!attrs.some((a) => a.startsWith('loading='))) attrs.push('loading="lazy"');
    if (!attrs.some((a) => a.startsWith('decoding='))) attrs.push('decoding="async"');
    return `<img ${attrs.join(' ')}>`;
  });
}

/** Widths a photo is displayed at (see scripts/image-audit.md): hero 832 CSS px,
 * gallery tile 267, card portrait 404 — each at 1× and 2×. */
export const HERO_WIDTHS = [416, 832];
export const TILE_WIDTHS = [267, 534];
export const CARD_WIDTHS = [404, 808];

/** Body photos sit in `TEXT_COLUMN`: the container is 832 CSS px, three columns with
 * `gap-x-6` make each 261, so two columns plus the gap is ~547 CSS px — 1× and 2×. */
export const BODY_WIDTHS = [547, 1094];
