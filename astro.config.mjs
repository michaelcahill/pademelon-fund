// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';

// Use GITHUB_PAGES env var to conditionally set the base path.
// - Local dev: base is empty, site serves at /
// - GitHub Pages: base is /pademelon-fund, site serves at /pademelon-fund/
// - Custom domain: base is empty (just remove the env var), site serves at /
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const base = isGithubPages ? '/pademelon-fund' : '';

// HAST plugin for the Sätteri Markdown processor to prefix image src paths
// with the base path in markdown content.
// Astro automatically prefixes CSS/JS assets and astro:assets images, but not
// regular markdown <img> src attributes.
function prefixImagePaths() {
  return {
    name: 'prefix-image-paths',
    element: {
      filter: ['img'],
      visit(node, ctx) {
        const src = node.properties?.src;
        if (
          base &&
          typeof src === 'string' &&
          !src.startsWith(base) &&
          !src.startsWith('http')
        ) {
          ctx.setProperty(node, 'src', base + src);
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  base,
  site: isGithubPages ? 'https://michaelcahill.github.io/pademelon-fund' : undefined,
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    processor: satteri({
      hastPlugins: [prefixImagePaths()],
    }),
  },
});
