/**
 * The page shell: one width for header, main and footer, on every page.
 *
 * This used to be a `wide` flag that layouts could opt into (a much wider
 * container), which
 * made the sticky nav bar change width between text pages and gallery pages as
 * you navigated. The shell is now deliberately uniform — content that needs
 * more room (grids, hero images) works within this measure instead of widening
 * the whole document.
 *
 * Keep every layout/component using this constant rather than repeating width
 * classes, so header / main / footer cannot drift apart again.
 */
export const SHELL_CONTAINER = 'mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8';

/**
 * The three-column split used from `md` (48rem, 768px — an iPad in portrait).
 * The left column is
 * kept clear for the pademelon watermark (see BaseLayout), so body text sits in
 * the right two columns; titles, descriptions, hero images and card grids span
 * all three.
 *
 * Put `SHELL_GRID` on a container and give each block one of the two spans. A
 * container that holds both kinds needs to be a full-width grid item *and*
 * split its own children into the same columns — that is `FULL_GRID`.
 *
 * Below `md` every utility is inert, so the layout stays single-column. The split
 * used to start at `lg` (64rem), which no iPad in portrait reaches; moving it to
 * `md` adds the columns for 768–1023px and leaves desktop untouched, since the
 * grid was already active there.
 */
export const SHELL_GRID = 'md:grid md:grid-cols-3 md:gap-x-6';

/** The right two columns: reading text, kept to a narrower measure. */
export const TEXT_COLUMN = 'md:col-start-2 md:col-span-2';

/** All three columns: headings, standfirsts, hero images, card grids. */
export const FULL_WIDTH = 'md:col-span-3';

/** Full-width grid item that nests the same three-column split. */
export const FULL_GRID = `${FULL_WIDTH} ${SHELL_GRID}`;

/**
 * The typography wrapper used wherever markdown is injected. Kept in one place
 * because content rendered outside it loses all `prose` styling — and a block
 * placed between two prose sections (the people cards) needs its trailing text
 * to look identical to the leading text.
 */
export const PROSE_CLASS = 'prose max-w-none';
