/**
 * Raw HTML snippets, inserted verbatim into pages and impact posts.
 *
 * A snippet is a markdown file in `src/content/snippets/` whose body is plain
 * HTML (no frontmatter needed). Its filename (minus `.md`) is its name:
 *
 *     src/content/snippets/contact-form.md  ->  {{contact-form}}
 *
 * Write `{{snippet-name}}` anywhere in a page or post body and the snippet's
 * HTML replaces it at build time, untouched — no markdown parsing, so forms,
 * `<script>` tags and anything else survive exactly as written. A placeholder
 * alone on a line becomes its own `<p>` during markdown rendering; that wrapper
 * is removed so block-level snippets aren't nested inside a paragraph.
 *
 * This is the general case of the `{{cards}}` marker handled by src/lib/cards.ts
 * — but while `cards` renders a generated grid, a snippet is inserted verbatim.
 * Pages CMS edits snippets through the `snippets` collection in .pages.yml
 * (a plain text field, never rich-text, so the HTML is never rewritten).
 */

import { getCollection } from 'astro:content';

/** `{{ name }}`, tolerating inner whitespace. */
const PLACEHOLDER = /\{\{\s*([\w-]+)\s*\}\}/g;

/** Handled elsewhere — `{{cards}}` is the cards-grid marker, not a snippet. */
const RESERVED = new Set(['cards']);

let cache: Promise<Map<string, string>> | undefined;

/** All snippets as `name -> raw HTML body`, loaded once per build. */
function loadSnippets(): Promise<Map<string, string>> {
  cache ??= getCollection('snippets').then((entries) =>
    new Map(entries.map((entry) => [entry.id, (entry.body ?? '').trim()])),
  );
  return cache;
}

/**
 * Replaces every `{{snippet-name}}` in rendered HTML with the snippet's raw
 * body. Unknown names are left in place (with a build warning) so they stay
 * visible instead of silently vanishing.
 */
export async function injectSnippets(html: string): Promise<string> {
  if (!html.includes('{{')) return html;

  const snippets = await loadSnippets();
  const names = new Set(
    [...html.matchAll(PLACEHOLDER)]
      .map((match) => match[1])
      .filter((name) => !RESERVED.has(name)),
  );

  for (const name of names) {
    const body = snippets.get(name);
    if (body === undefined) {
      console.warn(
        `[snippets] No snippet named "${name}" in src/content/snippets — leaving {{${name}}} as written.`,
      );
      continue;
    }

    // Placeholder alone in its paragraph: replace the whole <p>…</p>.
    const block = new RegExp(
      `<p[^>]*>\\s*\\{\\{\\s*${name}\\s*\\}\\}\\s*</p>`,
      'g',
    );
    html = html.replace(block, () => body);

    // Remaining inline occurrences.
    html = html.replace(PLACEHOLDER, (match, found: string) =>
      found === name ? body : match,
    );
  }

  return html;
}
