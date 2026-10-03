// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';

// Use GITHUB_PAGES env var to conditionally set the base path.
// - Local dev: base is empty, site serves at /
// - GitHub Pages: base is /pademelon-fund, site serves at /pademelon-fund/
// - Custom domain: base is empty (just remove the env var), site serves at /
const base = '';

// Canonical origin. Used for <link rel="canonical">, og:url and /sitemap.xml.
// Override with SITE_URL if the site is ever served from another host (e.g.
// https://michaelcahill.github.io/pademelon-fund while on GitHub Pages).
const site = process.env.SITE_URL ?? 'https://pademelon.fund';

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

/**
 * @astrojs/sitemap always writes an index file (`sitemap-index.xml`) pointing
 * at one chunk per 45 000 URLs (`sitemap-0.xml`). This site is nowhere near
 * that limit, and tools such as GitCMS look for a plain `/sitemap.xml`, so the
 * single chunk is published under that name and the redundant index removed.
 *
 * Registered after `sitemap()` so it runs once the files exist; if the site
 * ever grows past one chunk the index is left alone.
 */
function plainSitemapFile() {
  return {
    name: 'plain-sitemap-file',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        const chunk = path.join(out, 'sitemap-0.xml');
        if (!fs.existsSync(chunk) || fs.existsSync(path.join(out, 'sitemap-1.xml'))) {
          return;
        }
        fs.renameSync(chunk, path.join(out, 'sitemap.xml'));
        fs.rmSync(path.join(out, 'sitemap-index.xml'), { force: true });
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  base,
  site,
  integrations: [sitemap(), plainSitemapFile()],
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
