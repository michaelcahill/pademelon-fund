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
 * The typography wrapper used wherever markdown is injected. Kept in one place
 * because content rendered outside it loses all `prose` styling — and a block
 * placed between two prose sections (the people cards) needs its trailing text
 * to look identical to the leading text.
 */
export const PROSE_CLASS = 'prose prose-slate prose-emerald max-w-none';
