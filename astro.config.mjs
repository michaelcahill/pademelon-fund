// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Use GITHUB_PAGES env var to conditionally set the base path.
// - Local dev: base is empty, site serves at /
// - GitHub Pages: base is /pademelon-fund, site serves at /pademelon-fund/
// - Custom domain: base is empty (just remove the env var), site serves at /
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const base = isGithubPages ? '/pademelon-fund' : '';

// Rehype plugin to prefix image src paths with the base path in markdown content.
// Astro automatically prefixes CSS/JS assets and astro:assets images, but not
// regular markdown <img> src attributes.
function prefixImagePaths() {
  return (tree) => {
    function visit(node) {
      if (
        node.type === 'element' &&
        node.tagName === 'img' &&
        node.properties &&
        typeof node.properties.src === 'string' &&
        base &&
        !node.properties.src.startsWith(base) &&
        !node.properties.src.startsWith('http')
      ) {
        node.properties.src = base + node.properties.src;
      }
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
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
    rehypePlugins: [prefixImagePaths]
  }
});
