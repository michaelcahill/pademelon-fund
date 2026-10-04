import { existsSync } from 'node:fs';
import path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './paths';

/**
 * People are one markdown file each in `src/content/people/`, rendered as cards.
 *
 * The markdown body is the bio, so it stays ordinary prose — no HTML needed.
 * Portraits follow the gallery convention: drop `public/images/people/<slug>.jpg`
 * in place and it is picked up without any frontmatter.
 */

const IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');
const PORTRAIT_DIR = path.join(IMAGES_DIR, 'people');
const PORTRAIT_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

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
 * Portrait for a person: the `image` frontmatter field when present, otherwise
 * the first `public/images/people/<slug>.<ext>` that exists.
 * Returns a base-prefixed URL, or undefined when there is no photo (the card
 * then simply renders without one).
 */
export function portraitFor(person: Person): string | undefined {
  if (person.data.image) return withBase(person.data.image);

  // Never allow a slug like `../../etc` to escape public/images/people.
  const file = PORTRAIT_EXT.map((ext) => path.join(PORTRAIT_DIR, `${person.id}${ext}`)).find(
    (candidate) =>
      (candidate === PORTRAIT_DIR || candidate.startsWith(PORTRAIT_DIR + path.sep)) &&
      existsSync(candidate),
  );

  return file
    ? withBase(path.posix.join('/images/people', `${person.id}${path.extname(file)}`))
    : undefined;
}
