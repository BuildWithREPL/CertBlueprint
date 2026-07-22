// Structured-data builders for CertBlueprint pages.
// Kept free of fabricated fields (no fake dates/ratings) so markup stays honest.

const SITE = 'https://certblueprint.com';

/**
 * TechArticle schema for a certification guide page.
 * @param {object} data - the certification content entry
 * @param {string} url  - the canonical page URL (Astro.url.href)
 */
export function techArticleSchema(data, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: data.title,
    description: data.seo_description ?? data.description,
    about: { '@type': 'Thing', name: data.title },
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'CertBlueprint', url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'CertBlueprint',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/og-default.png` },
    },
  };
}
