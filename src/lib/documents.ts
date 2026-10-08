/**
 * Upload files under `public/documents`, served from `/documents/…` (see the
 * `documents` media source in .pages.yml).
 *
 * The extension list lives here so it is shared by the three places that need
 * it: `astro.config.mjs` (resolving an upload referenced by name alone, and
 * marking upload links), and pages that link to uploads.
 */

/** Any file accepted by the Documents upload source. */
export const DOCUMENT_EXT = /\.(pdf|docx?|xlsx?|csv|pptx?|odt|ods|rtf|txt|zip|gz|epub|ics)$/i;

/** True when a path points at an uploaded file rather than a page. */
export function isDocumentPath(pathname: string): boolean {
  return DOCUMENT_EXT.test(pathname);
}
