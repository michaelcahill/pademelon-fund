import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { photoFor } from './photos';

/**
 * People are one markdown file each in `src/content/people/`, rendered as cards.
 *
 * The markdown body is the bio, so it stays ordinary prose — no HTML needed.
 * Portraits follow the gallery convention: drop `src/assets/images/people/<slug>.jpg`
 * in place and it is picked up without any frontmatter.
 */

export type Person = CollectionEntry<'people'>;

/** All people, ordered by `order` then name. */
export async function getPeople(): Promise<Person[]> {
  const people = await getCollection('people');
  return people.sort(
    (a, b) =>
      (a.data.order ?? 0) - (b.data.order ?? 0) ||
      a.data.name.localeCompare(b.data.name),
  );
}

/**
 * Portrait for a person: the `image` frontmatter field when present, otherwise the
 * photo named after their slug in `src/assets/images/people/`. Returns Astro's asset
 * metadata (for `<Image>`), or undefined when there is no photo — the card then
 * renders without one.
 */
export function portraitFor(person: Person): ImageMetadata | undefined {
  if (person.data.image) return photoFor(person.data.image);
  // The slug is a filename stem, so `people/<slug>` resolves against the photo tree.
  return photoFor(`people/${person.id}`);
}
