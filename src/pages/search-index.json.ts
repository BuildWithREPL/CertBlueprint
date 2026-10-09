import { getCollection } from 'astro:content';
import { ROLES } from '../lib/navigator/data/roles';
import { TRIALS } from '../lib/navigator/data/trials';

/**
 * The site search index, generated.
 *
 * It used to be a hand-maintained array inside SearchModal.astro. That worked
 * while someone remembered to add a line per guide, and it had already drifted:
 * all 53 certifications were listed, but none of the 11 career paths and none
 * of the role pages were — so searching "help desk" found nothing.
 *
 * Generated from the collections instead, and fetched on first use rather than
 * inlined into every page: the index is bigger than the modal's own markup, and
 * most visits never open search.
 */

interface Doc {
  title: string;
  description: string;
  url: string;
  type: 'certification' | 'vendor' | 'path' | 'role' | 'comparison' | 'trial' | 'page' | 'legal';
}

/** Pages that are not collection-driven and so have to be named here. */
const STATIC_PAGES: Doc[] = [
  { title: 'Home', description: 'IT certification roadmaps, study plans, and the free career navigator.', url: '/', type: 'page' },
  { title: 'Browse vendors', description: 'Every certification body covered here, entry level through expert.', url: '/vendors/', type: 'page' },
  { title: 'IT Career Navigator', description: 'Find the IT work you would actually enjoy. Free, scenario-based, runs in your browser.', url: '/navigator/', type: 'page' },
  { title: 'Find my path — assessment', description: 'Real situations from real IT jobs; choose the work you would want to dig into.', url: '/navigator/assessment/', type: 'page' },
  { title: 'The IT career map', description: 'Every role and the moves between them. Build a path from where you are to where you want to be.', url: '/navigator/graph/', type: 'page' },
  { title: 'Compare two roles', description: 'Side-by-side comparisons of the IT jobs people most often confuse.', url: '/navigator/compare/', type: 'page' },
  { title: 'Weekend trials', description: 'Try a slice of the real work for free before committing to a certification.', url: '/navigator/trials/', type: 'page' },
  { title: 'Technology inventory', description: 'Tick the technologies you have used and see the capabilities and roles they add up to.', url: '/navigator/inventory/', type: 'page' },
  { title: 'Military to IT', description: 'Translate what you did in uniform into civilian IT roles, by capability rather than job title.', url: '/navigator/military/', type: 'page' },
  { title: 'Navigator Lab', description: 'Describe how you like to work in your own words; an AI reader points you at a field.', url: '/navigator-lab', type: 'page' },
  { title: 'Career paths', description: 'Role-by-role roadmaps: the certifications and skills in the order that works.', url: '/paths/', type: 'page' },
  { title: 'Certification comparisons', description: 'Honest head-to-heads with the short answer up front.', url: '/compare/', type: 'page' },
  { title: 'Explore roles by field', description: 'Browse every IT role grouped by field, with the honest downside of each.', url: '/navigator/explore/', type: 'page' },
  { title: 'About CertBlueprint', description: 'Who runs this site, how content is written and checked, and how it is funded.', url: '/about/', type: 'page' },
  { title: 'Contact', description: 'Corrections, feedback, and privacy questions.', url: '/contact/', type: 'page' },
  { title: 'Privacy Policy', description: 'How analytics, advertising, affiliate links and the navigator handle data.', url: '/legal/privacy-policy/', type: 'legal' },
  { title: 'Affiliate Disclosure', description: 'Which links earn a commission, and how that does not change recommendations.', url: '/legal/affiliate-disclosure/', type: 'legal' },
  { title: 'Terms of Use', description: 'The rules for using the site and the limits of our liability.', url: '/legal/terms-of-use/', type: 'legal' },
];

function clip(text: string, max = 150): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

export async function GET() {
  const [certs, vendors, paths, comparisons] = await Promise.all([
    getCollection('certifications'),
    getCollection('vendors'),
    getCollection('paths'),
    getCollection('comparisons'),
  ]);

  const docs: Doc[] = [
    ...STATIC_PAGES,
    ...certs.map((c) => ({
      title: c.data.short_name ? `${c.data.short_name} — ${c.data.vendor}` : c.data.title,
      description: clip(`${c.data.exam_code} · ${c.data.description}`),
      url: `/vendors/${c.data.vendor_slug}/${c.data.slug}/`,
      type: 'certification' as const,
    })),
    ...vendors.map((v) => ({
      title: v.data.title,
      description: clip(v.data.overview),
      url: `/vendors/${v.data.slug}/`,
      type: 'vendor' as const,
    })),
    ...paths.map((p) => ({
      title: p.data.role,
      description: clip(p.data.tagline),
      url: `/paths/${p.data.slug}/`,
      type: 'path' as const,
    })),
    ...ROLES.map((r) => ({
      title: r.name,
      description: clip(r.purpose),
      url: `/navigator/roles/${r.slug}/`,
      type: 'role' as const,
    })),
    ...comparisons.map((c) => ({
      title: c.data.title,
      description: clip(c.data.verdict),
      url: `/compare/${c.data.slug}/`,
      type: 'comparison' as const,
    })),
    ...TRIALS.map((t) => ({
      title: t.name,
      description: clip(`${t.time} · ${t.objective}`),
      url: `/navigator/trials/#${t.slug}`,
      type: 'trial' as const,
    })),
  ];

  // A search result that 404s is worse than no result. Slugs come from the same
  // collections the routes are generated from, so the checks worth making are
  // for duplicates and empty fields.
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    if (seen.has(doc.url)) errors.push(`duplicate search URL: ${doc.url}`);
    seen.add(doc.url);
    if (!doc.title.trim()) errors.push(`search entry with no title: ${doc.url}`);
    if (!doc.description.trim()) errors.push(`search entry with no description: ${doc.url}`);
  }
  if (errors.length > 0) throw new Error(`Search index is broken:\n  ${errors.join('\n  ')}`);

  return new Response(JSON.stringify({ docs }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
