/**
 * Path helpers for sites served from a sub-path (e.g. GitHub Pages).
 *
 * Astro prefixes its own asset imports automatically, but hand-written URLs in
 * content and components still need the base path added by hand.
 */

/** The configured BASE_URL without a trailing slash (`''` or `/pademelon-fund`). */
export const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

/** Prefix a site-absolute path (`/images/x.jpg`) with the base path. */
export function withBase(pathname: string): string {
  if (/^(https?:)?\/\//.test(pathname) || pathname.startsWith('data:')) return pathname;
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${basePath}${clean}`;
}
