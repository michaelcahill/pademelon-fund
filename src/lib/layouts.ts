export type DeclaredLayout = 'auto' | 'page' | 'home' | 'gallery';
export type LayoutChoice = 'page' | 'home' | 'gallery';

/**
 * Decides which layout renders an entry.
 *
 * `layout: auto` (the default) picks the gallery layout when the entry's image
 * folder contains images, and the plain page layout otherwise. That means a new
 * gallery is created by dropping images into `public/images/<slug>/` — no
 * frontmatter required. Set `layout: page` or `layout: gallery` to be explicit.
 */
export function pickLayout(
  declared: DeclaredLayout | undefined = 'auto',
  imageCount = 0,
): LayoutChoice {
  switch (declared) {
    case 'page':
      return 'page';
    case 'home':
      return 'home';
    case 'gallery':
      return 'gallery';
    default:
      return imageCount > 0 ? 'gallery' : 'page';
  }
}
