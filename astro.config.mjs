// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails the build if any page links to an internal URL that was not built.
 * Scripts are stripped first: client code assembles hrefs from strings, which
 * are not real links. Extend IGNORE only for paths served outside dist.
 */
/** @returns {import('astro').AstroIntegration} */
function internalLinkCheck() {
  const IGNORE = [/^\/cdn-cgi\//, /^\/api\//];
  return {
    name: 'internal-link-check',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        /** @type {string[]} */
        const pages = [];
        (function walk(/** @type {string} */ d) {
          for (const name of readdirSync(d)) {
            const p = join(d, name);
            if (statSync(p).isDirectory()) walk(p);
            else if (name.endsWith('.html')) pages.push(p);
          }
        })(root);

        const resolves = (/** @type {string} */ path) => {
          const target = join(root, path);
          return (
            (existsSync(target) && statSync(target).isFile()) ||
            existsSync(join(target, 'index.html')) ||
            existsSync(target.replace(/[\\/]$/, '') + '.html')
          );
        };

        /** @type {string[]} */
        const broken = [];
        for (const page of pages) {
          const html = readFileSync(page, 'utf8').replace(/<script\b[\s\S]*?<\/script>/g, '');
          for (const [, href] of html.matchAll(/href="(\/(?!\/)[^"]*)"/g)) {
            const path = decodeURI(href.split(/[#?]/)[0]);
            if (!path || IGNORE.some((re) => re.test(path)) || resolves(path)) continue;
            broken.push(`${page.slice(root.length - 1).replace(/\\/g, '/')} → ${href}`);
          }
        }
        if (broken.length > 0) {
          throw new Error(`Internal link check: ${broken.length} broken link(s):\n  ${[...new Set(broken)].slice(0, 50).join('\n  ')}`);
        }

        /* The Worker answers retired URLs with a 301 before the site sees
           them. A target that stops being built turns the redirect into a 404
           one hop later; a source that starts being built is a real page the
           Worker hides. Neither shows up anywhere else. */
        const worker = readFileSync(join(process.cwd(), 'worker', 'index.js'), 'utf8');
        const retiredBlock = worker.match(/const RETIRED = \{([\s\S]*?)\n\};/);
        if (!retiredBlock) {
          throw new Error('Retired URL check: cannot find RETIRED in worker/index.js — update internalLinkCheck.');
        }
        /** @type {string[]} */
        const badRedirects = [];
        const retired = [...retiredBlock[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)];
        for (const [, from, to] of retired) {
          if (!resolves(to)) badRedirects.push(`${from} → ${to}: target is not built`);
          if (resolves(from)) badRedirects.push(`${from}: a built page sits behind this redirect`);
        }
        if (badRedirects.length > 0) {
          throw new Error(`Retired URL check: ${badRedirects.length} problem(s):\n  ${badRedirects.join('\n  ')}`);
        }

        /* A page nobody links to is invisible however good it is. Adding a
           certification generates its page automatically, but vendor hubs list
           their guides editorially — so a new guide can end up reachable only
           from the sitemap. Same for a new career path. */
        const linkedFrom = (/** @type {string} */ hub, /** @type {string} */ href) =>
          existsSync(hub) && readFileSync(hub, 'utf8').includes(`href="${href}"`);

        /** @type {string[]} */
        const orphans = [];
        for (const page of pages) {
          const url = '/' + page.slice(root.length).replace(/\\/g, '/').replace(/index\.html$/, '');
          const cert = url.match(/^\/vendors\/([^/]+)\/([^/]+)\/$/);
          if (cert && !linkedFrom(join(root, 'vendors', cert[1], 'index.html'), url)) {
            orphans.push(`${url} is not linked from /vendors/${cert[1]}/`);
          }
          const careerPath = url.match(/^\/paths\/([^/]+)\/$/);
          if (careerPath && !linkedFrom(join(root, 'paths', 'index.html'), url)) {
            orphans.push(`${url} is not linked from /paths/`);
          }
        }
        if (orphans.length > 0) {
          throw new Error(`Hub coverage check: ${orphans.length} page(s) nothing links to:\n  ${orphans.join('\n  ')}`);
        }

        /* Most guides render from CertGuide, but six pages are bespoke. A
           bespoke page that forgets the freshness stamp quietly drops the one
           claim readers use to judge whether the exam facts are current. */
        const certDir = join(process.cwd(), 'src', 'content', 'certifications');
        /** @type {string[]} */
        const unstamped = [];
        for (const name of readdirSync(certDir)) {
          if (!name.endsWith('.json')) continue;
          const cert = JSON.parse(readFileSync(join(certDir, name), 'utf8'));
          if (!cert.last_verified) continue;
          const page = join(root, 'vendors', cert.vendor_slug, cert.slug, 'index.html');
          if (!existsSync(page) || !readFileSync(page, 'utf8').includes('last verified')) {
            unstamped.push(`/vendors/${cert.vendor_slug}/${cert.slug}/ sets last_verified but does not render it`);
          }
        }
        if (unstamped.length > 0) {
          throw new Error(`Verification stamp check: ${unstamped.length} page(s):\n  ${unstamped.join('\n  ')}`);
        }

        /* The navigator's map card sells the map by showing it. If the drawing
           ever renders empty the card still looks fine — a tidy violet box with
           a paragraph in it — so nothing would report the loss. Compare it
           against the real map instead: same dots, same count. */
        const countIn = (/** @type {string[]} */ segments, /** @type {RegExp} */ re) => {
          const file = join(root, ...segments);
          return existsSync(file) ? (readFileSync(file, 'utf8').match(re) ?? []).length : 0;
        };
        const mapDots = countIn(['navigator', 'graph', 'index.html'], /class="nav-graph__dot/g);
        const teaserDots = countIn(['navigator', 'index.html'], /nav-map-teaser__dot/g);
        if (teaserDots !== mapDots) {
          throw new Error(
            `Career map preview check: /navigator/ draws ${teaserDots} roles, the map at /navigator/graph/ draws ${mapDots}. ` +
              'The teaser is meant to be the same graph — an empty or partial one still looks like a finished card.',
          );
        }

        logger.info(`internal links OK across ${pages.length} pages; all ${retired.length} retired URLs redirect to built pages; every guide and path is linked from its hub, every verified guide shows its stamp, and the map teaser draws all ${mapDots} roles`);
      },
    },
  };
}

export default defineConfig({
  site: 'https://certblueprint.com',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    internalLinkCheck(),
    sitemap({
      // Let Astro auto-discover all static routes.
      // Do NOT use customPages for pages that Astro already generates —
      // it can prevent proper auto-discovery and requires manual maintenance.
      // /navigator/results/ is rendered entirely client-side from session state,
      // so there is nothing for a crawler to index — it is noindex'd too.
      // /navigator/plan/<path>/ trackers are personal checklists stored in the
      // browser — noindex'd, so they must not be advertised here either.
      filter: (page) =>
        !page.endsWith('/404/') &&
        !page.endsWith('/navigator/results/') &&
        !/\/navigator\/plan\/[^/]+\/$/.test(page),
      // navigator-lab is a hand-written file in public/, which Astro does not
      // route — so it is the one page that has to be listed explicitly.
      customPages: ['https://certblueprint.com/navigator-lab'],
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
    }),
  ],
  output: 'static',
});
