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
//
// Note: `features: { rawHtml: true }` must be enabled below so that explicit
// <img> tags written as raw HTML in markdown are parsed into real HAST element
// nodes (instead of opaque `raw` nodes) and thus visited by this plugin.
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
      // Parse raw HTML into structured HAST element nodes so the
      // prefixImagePaths plugin can visit <img> tags regardless of whether
      // they are written as markdown syntax or as raw HTML.
      features: { rawHtml: true },
      hastPlugins: [prefixImagePaths()],
    }),
  },
});
