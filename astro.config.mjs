// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { DOCUMENT_EXT, isDocumentPath } from './src/lib/documents';

// Base path. Served from a custom domain at the root, so this stays empty.
// Set it (e.g. '/pademelon-fund') only if the site ever moves under a
// sub-directory, such as GitHub Pages without a custom domain.
const base = '';

// Canonical origin. Used for <link rel="canonical">, og:url and /sitemap.xml.
// Override with SITE_URL if the site is ever served from another host (e.g. a
// GitHub Pages preview at https://michaelcahill.github.io/pademelon-fund).
const site = process.env.SITE_URL ?? 'https://pademelon.fund';

// Static uploads live in `public/documents` and are served from
// `/documents/…` — see the `documents` media source in .pages.yml.
const DOCUMENTS_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public', 'documents');
const DOCUMENTS_URL = '/documents';


/**
 * Resolves a path written in content to a real file inside `public/documents`,
 * or returns `undefined`. Accepts `report.pdf`, `documents/report.pdf`,
 * `./public/documents/report.pdf` and sub-folders; `..` segments never escape
 * the documents folder.
 */
function findDocument(reference) {
  const relative = reference
    .replace(/^\.\//, '')
    .replace(/^(?:public\/)?documents\//, '')
    .replace(/^\/+/, '');
  if (!relative) return undefined;

  const parts = relative.split('/');
  if (parts.some((part) => part === '' || part === '..')) return undefined;

  const absolute = path.join(DOCUMENTS_ROOT, ...parts);
  if (absolute !== DOCUMENTS_ROOT && !absolute.startsWith(DOCUMENTS_ROOT + path.sep)) {
    return undefined;
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return undefined;

  // Forward-slash, repo-relative path used to build the public URL.
  return absolute.slice(DOCUMENTS_ROOT.length + 1).split(path.sep).join('/');
}

// HAST plugin for the Sätteri Markdown processor. Two jobs on content:
//
// 1. Prefixes root-relative `src`/`href` values with the base path. Astro
//    prefixes its own assets and astro:assets images automatically, but not the
//    URLs you write in markdown.
// 2. Lets an uploaded file be referenced by name alone: `[Rules](rules.pdf)`,
//    `[Rules](documents/rules.pdf)` and `[Rules](public/documents/rules.pdf)`
//    all become `/documents/rules.pdf` (or the base-prefixed equivalent) when
//    that file exists. Plain relative links that are not uploads — `../about`,
//    `sibling.html` — and absolute/external URLs are left exactly as written.
//
// Note: `features: { rawHtml: true }` must be enabled below so that explicit
// <img> tags written as raw HTML in markdown are parsed into real HAST element
// nodes (instead of opaque `raw` nodes) and thus visited by this plugin.
function prefixContentPaths() {
  return {
    name: 'prefix-content-paths',
    element: {
      filter: ['img', 'source', 'a'],
      visit(node, ctx) {
        const key = node.tagName === 'a' ? 'href' : 'src';
        const value = node.properties?.[key];
        if (typeof value !== 'string' || value === '') return;

        // External, protocol-relative, mail/tel, in-page anchors: untouched.
        if (/^(https?:)?\/\//i.test(value) || /^(mailto:|tel:|#|data:)/i.test(value)) return;

        // (2) Upload shorthand → canonical /documents/… URL.
        if (!value.startsWith('/') && DOCUMENT_EXT.test(value)) {
          const found = findDocument(value);
          if (found) {
            ctx.setProperty(node, key, `${base}${DOCUMENTS_URL}/${encodeURI(found)}`);
            return;
          }
        }

        // (1) Base-path prefixing for site-absolute paths.
        if (base && !value.startsWith(base)) {
          ctx.setProperty(node, key, base + value);
        }
      },
    },
  };
}

/**
 * Mark links to uploaded files so Astro's prefetcher leaves them alone.
 *
 * `prefetch` below watches every internal link, and Astro does not filter by
 * file type: hovering a "Read the report" card would pull a multi-megabyte PDF
 * across the wire. `data-astro-prefetch="false"` opts a link out, which is what
 * this plugin writes on any anchor whose target is an upload. Content-authored
 * links get it here; site-authored ones (the impact cards) set the attribute in
 * their component, using `isDocumentPath`.
 */
function skipUploadPrefetch() {
  return {
    name: 'skip-upload-prefetch',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href === 'string' && isDocumentPath(href)) {
          ctx.setProperty(node, 'data-astro-prefetch', 'false');
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
  // Hover-prefetch every internal link: pages are 1–40 KB of HTML, so a link
  // that is hovered is already in the browser cache when it is tapped. Uploads
  // are opted out by the skipUploadPrefetch plugin and by the impact cards.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    // `/founders` is a redirect stub for the renamed People page — keep it out
    // of the sitemap so only /people is advertised.
    sitemap({ filter: (page) => !page.replace(/\/+$/, '').endsWith('/founders') }),
    plainSitemapFile(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // glightbox is CommonJS, so the dev server has to prebundle it. Left out of
    // `include`, Vite optimises it lazily and the page keeps requesting a stale
    // `?v=` hash — the dev server answers 504, the Lightbox module never loads,
    // and clicking a gallery tile falls through to the anchor's href (the browser
    // opens the bare image). Naming it here prebundles it at startup.
    optimizeDeps: { include: ['glightbox'] },
  },
  markdown: {
    processor: satteri({
      // Parse raw HTML into structured HAST element nodes so the
      // prefixContentPaths plugin can visit <img> and <a> tags regardless of
      // whether they are written as markdown syntax or as raw HTML.
      features: { rawHtml: true },
      hastPlugins: [prefixContentPaths(), skipUploadPrefetch()],
    }),
  },
});
