/** Site-wide constants used for document metadata. */
export const siteName = 'Pademelon Fund';

/** Fallback used when a page does not supply its own description. */
export const defaultDescription =
  'Supporting grassroots action for nature, First Nations and climate across Australia.';

/**
 * Builds the value for `<title>` / `og:title`.
 *
 * Inner pages read "Page — Pademelon Fund" so a browser tab or bookmark still
 * identifies the site when several of its tabs are open. The suffix is skipped
 * when the title already contains the site name, which keeps the home page
 * ("Pademelon Fund") and posts such as "Welcome to Pademelon Fund" from
 * repeating it.
 */
export function pageTitle(title: string): string {
  return title.includes(siteName) ? title : `${title} | ${siteName}`;
}
