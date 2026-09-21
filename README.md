# Pademelon Fund

An Astro site supporting grassroots action for nature, First Nations and climate action across Australia, editable via
[PagesCMS](https://pagescms.dev).

## Development

```sh
npm install      # install dependencies
npm run dev      # start local dev server at http://localhost:4321
```

## Project Structure

```text
/
├── public/
│   └── images/          # PagesCMS media uploads
├── src/
│   ├── content/
│   │   ├── pages/       # Standalone pages (About, etc.)
│   │   └── news/        # Blog-style news posts
│   ├── layouts/
│   │   └── Layout.astro # Shared page layout (header, nav, footer)
│   ├── pages/
│   │   ├── index.astro          # Home page
│   │   ├── [...slug].astro      # Dynamic route for pages collection
│   │   └── news/
│   │       ├── [slug].astro     # Individual news post
│   │       └── index.astro      # News listing
│   └── styles/
│       └── global.css
├── .pages.yml            # PagesCMS configuration
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Adding Content

Content is managed through [PagesCMS](https://pagescms.dev). The site uses two
content collections:

- **pages** — standalone pages like "About" (rendered at `/<slug>`)
- **news** — blog-style posts (rendered at `/news/<slug>`)

To add content locally, create `.md` files in `src/content/pages/` or
`src/content/news/` with frontmatter matching the collection schema (see
`src/content.config.ts`).

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site and deploys to GitHub Pages.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server                          |
| `npm run build`           | Builds production site to `./dist/`              |
| `npm run preview`         | Preview production build locally                 |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
