import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ─── Vendor collection ─────────────────────────────────────────
const vendors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/vendors' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    logo: z.string().optional(),
    overview: z.string(),
    why_vendor_matters: z.string(),
    certification_tracks: z.array(
      z.object({
        name: z.string(),
        level: z.string(),
        description: z.string(),
      })
    ),
    featured_certs: z.array(z.string()),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ),
    // ── Rich sections (optional): the bespoke vendor pages hardcode these in .astro;
    //    collection-driven vendors supply them here so the generic template reaches
    //    full parity (who-it's-for, salary impact, study difficulty, guides grid, etc.). ──
    who_its_for: z.array(z.object({ role: z.string(), detail: z.string() })).optional(),
    career_salary_impact: z.array(z.string()).optional(),
    study_difficulty: z.array(z.object({
      cert: z.string(), difficulty: z.string(), time: z.string(), detail: z.string(),
    })).optional(),
    available_guides: z.array(z.object({
      title: z.string(), level: z.string(), description: z.string(),
      slug: z.string(), vendor_slug: z.string(), featured: z.boolean().default(false),
    })).optional(),
    more_certs: z.array(z.object({
      title: z.string(), level: z.string(), description: z.string(),
    })).optional(),
    related_paths: z.array(z.object({
      title: z.string(), href: z.string(), description: z.string(),
    })).optional(),
    cta: z.object({
      heading: z.string(), blurb: z.string(), href: z.string(), label: z.string(),
    }).optional(),
    seo_title: z.string(),
    seo_description: z.string(),
  }),
});

// ─── Certification collection ──────────────────────────────────
const certifications = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/certifications' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    short_name: z.string().optional(),
    former_name: z.string().optional(),
    vendor: z.string(),
    vendor_slug: z.string(),
    level: z.string(),
    description: z.string(),
    audience: z.string(),
    why_get_it: z.string(),
    when_to_get_it: z.string(),
    salary_range: z.string().optional(),
    salary_note: z.string().optional(),
    exam_code: z.string(),
    exam_duration: z.string(),
    exam_format: z.string(),
    exam_questions: z.string().optional(),
    // Multi-exam certifications (e.g. CCNP core + concentration, CCIE written + lab):
    // when present, the guide renders an "how it's assembled" breakdown per exam.
    exam_structure: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        role: z.string(), // "Core exam" | "Concentration — choose one" | "Lab exam" | "Qualifying exam"
        price: z.string(),
        note: z.string().optional(),
      })
    ).optional(),
    // Facts-freshness stamp shown in the exam-details section.
    last_verified: z.string().optional(),
    official_url: z.string().url(),
    official_pricing_url: z.string().url(),
    recertification_note: z.string().optional(),
    // Rich-content floors: a new cert guide CANNOT be published thin — every page
    // must carry real skills, a study path, free resources, a voucher link, FAQs,
    // and related certs, matching the bespoke pages. Build fails otherwise.
    skills_covered: z.array(
      z.object({
        category: z.string(),
        items: z.array(z.string()),
      })
    ).min(3),
    study_steps: z.array(
      z.object({
        step: z.number(),
        title: z.string(),
        description: z.string(),
      })
    ).min(5),
    free_resources: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        note: z.string().optional(),
      })
    ).min(3),
    paid_resources: z.array(
      z.object({
        provider: z.string(),
        type: z.string(),
        price: z.string(),
        best_for: z.string(),
        affiliate_url: z.string(),
        affiliate_label: z.string(),
        affiliate_event: z.string(),
        // true  = real affiliate/tracked link (currently Udemy via Impact)
        // false = plain reference link, no commission (Amazon, Boson, etc. until approved)
        affiliate: z.boolean().optional().default(false),
        note: z.string().optional(),
      })
    ),
    voucher_links: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
        note: z.string().optional(),
      })
    ).min(1),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).min(4),
    related_certs: z.array(
      z.object({
        title: z.string(),
        slug: z.string(),
        vendor: z.string(),
        vendor_slug: z.string(),
        reason: z.string(),
      })
    ).min(3),
    seo_title: z.string(),
    seo_description: z.string(),
  }),
});

// ─── Domain collection (the taxonomy backbone: Field of Practice) ──
const domains = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/domains' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    one_liner: z.string(),
    order: z.number(),
    specializations: z.array(z.string()).default([]),
  }),
});

// ─── Path collection (a Role's roadmap — the assessment's destination) ──
// A "CertBlueprint path" = a Role. Certifications are a FACET that points at
// the role (never the backbone). Skills are leveled (SFIA-style). See the IA doc.
const paths = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/paths' }),
  schema: z.object({
    slug: z.string(),
    role: z.string(),
    domain: z.string(), // domain slug
    specialization: z.string(),
    navigator_family: z.string().optional(), // which assessment result routes here
    tagline: z.string(),
    what_you_do: z.string(),
    day_in_life: z.array(z.string()),
    entry_titles: z.array(z.string()),
    // 1..4 texture bands, same axes as the assessment
    work_texture: z.object({
      communication: z.number(),
      technical_depth: z.number(),
      troubleshooting: z.number(),
      customer: z.number(),
      on_call: z.number(),
      remote: z.number(),
    }),
    salary: z.object({ median: z.string(), entry: z.string(), growth: z.string(), note: z.string() }),
    downsides: z.string(),
    work_style: z.object({ fits_if: z.array(z.string()), less_ideal_if: z.array(z.string()) }),
    skills: z.array(z.object({ name: z.string(), level: z.string(), note: z.string().optional() })),
    technologies: z.array(z.string()),
    // Certification FACET: links to existing /vendors/<vendor_slug>/<slug>/ guides.
    // May be empty for paths where no guide exists yet — cert_note carries the honest
    // "portfolio-first / guide coming" message instead of dead links.
    certs: z.array(z.object({
      title: z.string(), slug: z.string(), vendor_slug: z.string(), stage: z.string(), reason: z.string(),
    })).default([]),
    cert_note: z.string().optional(),
    trial: z.object({ objective: z.string(), time: z.string(), cost: z.string(), disclosure: z.string() }),
    roadmap: z.array(z.object({
      stage: z.string(), title: z.string(), focus: z.string(), cert_slug: z.string().optional(),
    })),
    adjacent_paths: z.array(z.object({ role: z.string(), slug: z.string(), reason: z.string() })),
    seo_title: z.string(),
    seo_description: z.string(),
  }),
});

// ─── Comparison collection (X vs Y decision pages) ─────────────
const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/comparisons' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    intro: z.string(),
    // The two contenders; href points at the live guide.
    a: z.object({ name: z.string(), href: z.string(), tagline: z.string() }),
    b: z.object({ name: z.string(), href: z.string(), tagline: z.string() }),
    verdict: z.string(), // the honest one-paragraph answer, up front
    rows: z.array(z.object({ label: z.string(), a: z.string(), b: z.string() })).min(5),
    pick_a_if: z.array(z.string()).min(3),
    pick_b_if: z.array(z.string()).min(3),
    both_note: z.string().optional(), // when "both, in this order" is the real answer
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(2),
    last_verified: z.string(),
    seo_title: z.string(),
    seo_description: z.string(),
  }),
});

export const collections = { vendors, certifications, domains, paths, comparisons };
