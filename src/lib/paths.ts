/**
 * Path helpers for sites served from a sub-path (e.g. GitHub Pages).
 *
 * Astro prefixes its own asset imports automatically, but hand-written URLs in
 * content and components still need the base path added by hand.
 */

/** The configured BASE_URL without a trailing slash (`''` or `/pademelon-fund`). */
export const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

/**
 * Prefix a site-absolute path (`/images/x.jpg`) with the base path.
 *
 * Idempotent: paths that already carry the base are returned as they are. Gallery
 * URLs come back from `withBase` (`getGalleryImages`) and markdown URLs are
 * prefixed by the Sätteri plugin in astro.config.mjs, so a second pass must not
 * produce `/pademelon-fund/pademelon-fund/…`.
 */
export function withBase(pathname: string): string {
  if (/^(https?:)?\/\//.test(pathname) || pathname.startsWith('data:')) return pathname;
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (basePath && (clean === basePath || clean.startsWith(`${basePath}/`))) return clean;
  return `${basePath}${clean}`;
}
