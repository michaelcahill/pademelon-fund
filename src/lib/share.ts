import { withBase } from './paths';

/**
 * Link-preview metadata (Facebook/WhatsApp/Messenger, X, Slack, LinkedIn,
 * iMessage, Brave…). Services read the `og:*` tags; X reads its own
 * `twitter:*` tags, so the card is written twice.
 */

/**
 * Preview card used when a page has no hero image of its own.
 *
 * Square and 1358px wide: above Facebook's 200×200 minimum, and small enough to
 * stay under X's 1 MB limit for `twitter:image`.
 */
export const defaultShareImage = '/images/pademelon-logo.png';

/**
 * Absolute URL for `og:image` / `twitter:image`, from a frontmatter path.
 *
 * Frontmatter stores site-absolute paths (`/images/x.jpg`). `withBase` adds the
 * sub-path base if the site is ever deployed under one, then `URL` resolves the
 * result against the canonical origin — preview services fetch images by absolute
 * URL and will not follow a root-relative path. A full URL (`https://…`) passes
 * through `withBase` untouched and comes back unchanged.
 */
export function shareImageUrl(pathname: string, origin: string): string {
  return new URL(withBase(pathname), origin).href;
}
