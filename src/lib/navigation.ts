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
export const contactHref = withBase('/contact-us');

/** Primary navigation. Paths are site-absolute; the base path is added here. */
export const navItems: NavItem[] = [
  { href: withBase('/founders'), label: 'The Founders' },
  { href: withBase('/our-partners'), label: 'Our Partners' },
  { href: withBase('/impact'), label: 'Impact' },
  { href: withBase('/co-funding'), label: 'Co-funding' },
  { href: contactHref, label: 'Contact us' },
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
