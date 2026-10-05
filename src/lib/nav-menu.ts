/**
 * Site menu wiring.
 *
 * Each `[data-nav-toggle]` drives the panel named by its `aria-controls`, so the
 * menu appears next to the button that opened it: the header toggle opens the
 * dropdown under the sticky header, the footer hamburger opens a card anchored
 * to the footer row.
 *
 * Nav.astro and Footer.astro both import this module and call `initSiteMenu()`.
 * Astro bundles each component's `<script>` separately and both run on every
 * page, so the guard below keeps the wiring (and its listeners) installed once.
 */

let wired = false;

interface Menu {
  toggle: HTMLElement;
  panel: Element;
}

export function initSiteMenu(): void {
  if (wired) return;

  const menus: Menu[] = Array.from(
    document.querySelectorAll<HTMLElement>('[data-nav-toggle]'),
  )
    .map((toggle) => {
      const id = toggle.getAttribute('aria-controls');
      const panel = id ? document.getElementById(id) : null;
      return panel ? { toggle, panel } : null;
    })
    .filter((menu): menu is Menu => menu !== null);

  if (menus.length === 0) return;
  wired = true;

  // State lives on the DOM: `aria-expanded` is announced and read back, and
  // `data-open` is what CSS shows/hides the panel from.
  const setOpen = ({ toggle, panel }: Menu, open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.setAttribute('data-open', String(open));
  };

  const isOpen = (menu: Menu) =>
    menu.toggle.getAttribute('aria-expanded') === 'true';

  for (const menu of menus) {
    // One menu at a time, so the header dropdown and the footer card can never
    // be open over each other.
    menu.toggle.addEventListener('click', () => {
      const open = !isOpen(menu);
      for (const other of menus) {
        if (other !== menu) setOpen(other, false);
      }
      setOpen(menu, open);
    });

    // Close after choosing a destination.
    menu.panel.addEventListener('click', (event) => {
      if ((event.target as Element | null)?.closest('a')) setOpen(menu, false);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = menus.find(isOpen);
    if (open) {
      setOpen(open, false);
      // Escape returns focus to the button that opened this menu.
      open.toggle.focus();
    }
  });

  // Reset when a dropdown is no longer needed. The header toggle is hidden
  // above --breakpoint-nav, which is read from CSS so JavaScript and styles
  // cannot drift apart: crossing that width upward closes any open menu whose
  // button has gone. (The footer hamburger stays visible at every width, so it
  // keeps its card.)
  if (typeof window.matchMedia !== 'function') return;

  const cssBreakpoint = getComputedStyle(document.documentElement)
    .getPropertyValue('--breakpoint-nav')
    .trim();
  const wide = window.matchMedia(`(min-width: ${cssBreakpoint || '40rem'})`);
  const onChange = (event: MediaQueryListEvent) => {
    if (!event.matches) return;
    for (const menu of menus) {
      if (isOpen(menu) && getComputedStyle(menu.toggle).display === 'none') {
        setOpen(menu, false);
      }
    }
  };
  if (typeof wide.addEventListener === 'function') {
    wide.addEventListener('change', onChange);
  }
}
