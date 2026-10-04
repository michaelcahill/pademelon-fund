/**
 * Where a generated card grid lands inside a page's own markdown.
 *
 * A page opts in with `cards: people` (which grid) and decides the position with
 * a marker on its own line in the body:
 *
 *     Intro text above the cards.
 *
 *     <!-- cards -->
 *
 *     Closing text below the cards.
 *
 * Both forms work — `{{cards}}` is accepted for editors that strip HTML
 * comments. The marker is removed from the rendered page; without one the grid
 * simply follows all of the page text, as it always has.
 */

/** Matches the marker either as an HTML comment or as a lone-paragraph token. */
const CARDS_MARKER =
  /\s*(?:<!--\s*cards\s*-->|<p[^>]*>\s*\{\{cards\}\}\s*<\/p>)\s*/i;

export interface CardSplit {
  /** Rendered HTML before the grid (may be empty). */
  before: string;
  /** Rendered HTML after the grid (empty when the page has no marker). */
  after: string;
}

/** Splits rendered page HTML at the cards marker. */
export function splitAtCards(html: string): CardSplit {
  const match = CARDS_MARKER.exec(html);
  if (!match) return { before: html.trim(), after: '' };

  return {
    before: html.slice(0, match.index).trimEnd(),
    after: html.slice(match.index + match[0].length).trimStart(),
  };
}
