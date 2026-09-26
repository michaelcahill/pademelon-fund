export interface NavItem {
  href: string;
  label: string;
}

/** Prefix a site-absolute path with Astro's BASE_URL (GitHub Pages subpaths). */
function withBase(pathname: string): string {
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  return base ? `${base}${pathname}` : pathname;
}

export const homeHref = withBase('/');
export const newsHref = withBase('/news');
export const contactHref = withBase('/contact');

/**
 * Primary navigation. Paths are site-absolute; the base path is added here.
 *
 * Labels are deliberately short — all of them share one line with the wordmark
 * down to the `--breakpoint-nav` width (see src/styles/global.css), so a long
 * label here pushes the menu into the dropdown on tablets.
 */
export const navItems: NavItem[] = [
  { href: withBase('/about'), label: 'About' },
  { href: withBase('/founders'), label: 'Founders' },
  { href: withBase('/partners'), label: 'Partners' },
  { href: withBase('/impact'), label: 'Impact' },
  { href: withBase('/co-funding'), label: 'Co-funding' },
  { href: contactHref, label: 'Contact' },
  { href: newsHref, label: 'News' },
];

/**
 * Highlights the current section, tolerating trailing slashes and matching
 * children (e.g. `/news/a-post` keeps `News` active).
 */
export function isActive(currentPathname: string, href: string): boolean {
  const strip = (value: string) => value.replace(/\/+$/, '');
  const current = strip(currentPathname);
  const target = strip(href);
  return current === target || current.startsWith(`${target}/`);
}
