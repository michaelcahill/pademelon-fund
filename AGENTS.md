# Pademelon Fund (Astro, static)

## Development

All commands below are verified against this project (Astro 7.3.3). `astro` is not on
`PATH`, so use the npm script or `npx` — a bare `astro dev` fails.

```bash
npm run dev -- --background        # background dev server (port 4321; falls back to
                                   # the next free port, so read the URL it prints)
npx astro dev status               # pid, uptime, "background" flag; nothing = not running
npx astro dev logs [--follow]      # works only for a server started with --background;
                                   # a foreground server logs in its own terminal
npx astro dev stop                 # prints "Stopped dev server (pid N)"
```

After changing `src/content.config.ts` or frontmatter, restart with `--force` if the
dev server serves stale content: `npx astro dev --background --force` (clears the
content-layer cache).

Verify work with `npm run build`, then check the rendered result by grepping
`dist/**/*.html` for hrefs/classes, and `dist/_astro/*.css` for the media queries a
breakpoint change produced. View the built site with `npm run preview` (foreground) or
`npx astro preview --background` + `npx astro preview status|stop`. Preview lands on 4321
only when no dev server is running — while one was up, preview took 4322 — so read the
URL it prints.
Avoid `npx astro check`: it prompts interactively to install `@astrojs/check`.

## Rules

- **Schema ↔ CMS:** any change to `src/content.config.ts` must be mirrored in
  `.pages.yml` (fields, labels, required flags) in the same commit. Compare field
  names for every collection — `galleryFields` is shared by `pages` and `impact`, so
  both need each gallery field. Parse `.pages.yml` with `js-yaml` from node_modules to
  check it stays in sync.
- **Page shell:** use the constants in `src/lib/shell.ts` (`SHELL_CONTAINER`,
  `SHELL_GRID`, `TEXT_COLUMN`, `FULL_WIDTH`, `FULL_GRID`, `PROSE_CLASS`) — never
  hardcode container, column or span classes. The three-column split (left column kept
  clear for the pademelon watermark) starts at `md` (768px = iPad portrait); changing
  that breakpoint means moving every shell utility together, and the watermark measures
  its column from `#watermark-probe`, so no JS maths to update.
- **URLs:** hand-written site-absolute paths go through `withBase()` (`src/lib/paths.ts`)
  for sub-path deploys; `http(s)` links are left alone. External links get
  `target="_blank" rel="noopener noreferrer"`, site paths stay in the same tab.
- **Card links:** frontmatter `link` sends the card's image and title to that
  destination (external URL or `/documents/…` path); the CTA always leads to the post's
  own page, so a redirected card still reaches its story. People portraits and partner
  logos wrap in their `link` when present, plain image when not.
- **Commits:** commit in logical units, keeping content/schema/CMS edits with the code
  that consumes them. Leave commits local — push only when asked.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Routing](https://docs.astro.build/en/guides/routing/) ·
  [Astro components](https://docs.astro.build/en/basics/astro-components/) ·
  [Framework components](https://docs.astro.build/en/guides/framework-components/) ·
  [Content collections](https://docs.astro.build/en/guides/content-collections/) ·
  [Styling / Tailwind](https://docs.astro.build/en/guides/styling/) ·
  [Internationalization](https://docs.astro.build/en/guides/internationalization/)
