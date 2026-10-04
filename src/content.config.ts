import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Fields shared by both collections. Galleries are folders of images inside
 * `public/images/` — see src/lib/galleries.ts.
 */
const galleryFields = {
  layout: z
    .enum(['auto', 'page', 'home', 'gallery'])
    .default('auto')
    .describe(
      'auto = gallery when the image folder has images, otherwise a plain page.',
    ),
  gallery: z
    .string()
    .optional()
    .describe(
      'Gallery folder inside public/images. Defaults to the entry slug.',
    ),
  galleryAspect: z
    .string()
    .default('3/2')
    .describe('CSS aspect-ratio for gallery tiles, e.g. 3/2, 1/1, 16/9.'),
  captions: z
    .string()
    .optional()
    .describe(
      'One line per image: filename.jpg: Caption. Parsed by lib/galleries.',
    ),
};

const pages = defineCollection({
  loader: glob({ base: 'src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /** Site-absolute path, e.g. /images/about/team.jpg */
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    ...galleryFields,
  }),
});

const impact = defineCollection({
  loader: glob({ base: 'src/content/impact', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    /** Featured image, shown at the top of the post. */
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    ...galleryFields,
  }),
});

const partners = defineCollection({
  loader: glob({ base: 'src/content/partners', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    /** Site-absolute path, e.g. /images/partners/nic.png */
    logo: z.string().optional(),
    /** Optional organisation website. */
    link: z.string().optional(),
    /** Sort order (lower first); defaults to 0. */
    order: z.number().optional(),
  }),
});

export const collections = { pages, impact, partners };
