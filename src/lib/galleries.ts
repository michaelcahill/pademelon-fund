import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { withBase } from './paths';

/**
 * Galleries are plain folders of images — no database, no index file.
 *
 * A gallery is any directory under `public/images/`. By convention a page or
 * news item uses the folder named after its slug (`src/content/pages/impact.md`
 * → `public/images/impact/`), which can be overridden per entry with the
 * `gallery` frontmatter field (e.g. `gallery: about` or `gallery: 2024/trip`).
 *
 * Images are shown in filename order, so prefix names (`01-arrival.jpg`,
 * `02-camp.jpg`…) to control the sequence.
 */

const IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

export interface GalleryImage {
  /** Absolute, base-prefixed URL, e.g. `/pademelon-fund/images/impact/camp.jpg` */
  src: string;
  /** Derived from the filename; used as alt text and lightbox caption. */
  alt: string;
  /** Original filename, handy for debugging. */
  file: string;
}

/** `02-river-rest.jpg` → `River rest` */
function titleFromFilename(file: string): string {
  const stem = file
    .replace(IMAGE_EXT, '')
    // Drop numeric ordering prefixes such as `01-` or `1.2_`.
    .replace(/^[\d.\s]+[-_.]\s*/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!stem) return '';
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

/**
 * Lists the images in a gallery folder, in filename order.
 *
 * Returns an empty array (never throws) when the folder is missing, so a page
 * can be published before its images are uploaded.
 */
export function getGalleryImages(folder?: string | null): GalleryImage[] {
  if (!folder) return [];

  const dir = path.resolve(IMAGES_DIR, folder);

  // Never allow `gallery: ../../etc` style paths to escape public/images.
  if (dir !== IMAGES_DIR && !dir.startsWith(IMAGES_DIR + path.sep)) return [];
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .filter((name) => IMAGE_EXT.test(name))
    // Natural sort so `2.jpg` sorts before `10.jpg`.
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((name) => ({
      src: withBase(path.posix.join('/images', folder.replace(/\\/g, '/'), name)),
      alt: titleFromFilename(name),
      file: name,
    }));
}

/** Convenience wrapper for listings that only need the count. */
export function countGalleryImages(folder?: string | null): number {
  return getGalleryImages(folder).length;
}

/** The gallery folder an entry points at: its `gallery` field, else its slug. */
export function galleryFolderFor(data: { gallery?: string }, id: string): string {
  return data.gallery ?? id;
}
