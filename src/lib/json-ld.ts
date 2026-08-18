import type { CollectionEntry } from "astro:content";
import { siteConfig, getCategoryName } from "../config";
import { countWords } from "./reading-time";

// Small, plain object shapes rather than a full schema.org type package —
// this file is the single place that assembles JSON-LD from siteConfig +
// post frontmatter, so no template hand-types its own copy. Forked from
// bytetech247.com's src/lib/json-ld.ts (Phase 3 of the build plan):
// organization() emits NewsMediaOrganization instead of Organization, and
// articleSchemaType() always resolves to NewsArticle (every category on
// this site is time-sensitive by definition, unlike the guides-site
// original this was forked from). faqJsonLd and webApplicationJsonLd are
// dropped — no faq schema field and no /tools/ section on this site.
type JsonLdObject = Record<string, unknown>;

function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).href;
}

/**
 * NewsMediaOrganization — a valid schema.org Organization subtype, and
 * what Google's News structured-data guidance recommends over a plain
 * Organization for a publisher that runs news content.
 */
function newsMediaOrganization(): JsonLdObject {
  const org: JsonLdObject = {
    "@type": "NewsMediaOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
  };
  if (siteConfig.logoImage) {
    org.logo = {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.logoImage),
    };
  }
  const sameAs = Object.values(siteConfig.social);
  if (sameAs.length > 0) org.sameAs = sameAs;
  return org;
}

function person(): JsonLdObject | undefined {
  // Guard rather than emit a Person with an empty name — matches the same
  // "don't fabricate" rule config.ts already follows.
  if (!siteConfig.author.name) return undefined;
  const p: JsonLdObject = {
    "@type": "Person",
    name: siteConfig.author.name,
    url: absoluteUrl("/about/"),
  };
  const sameAs = Object.values(siteConfig.social);
  if (sameAs.length > 0) p.sameAs = sameAs;
  return p;
}

/**
 * Standalone Person block for /about/ itself — every article's Article
 * JSON-LD already points its `author` at this exact URL (person()'s own
 * `url: absoluteUrl("/about/")` above) as the authority behind the
 * content, so the page that authority resolves to needs its own
 * Person/entity markup to back that up.
 */
export function personJsonLd(): JsonLdObject | undefined {
  const p = person();
  if (!p) return undefined;
  return { "@context": "https://schema.org", ...p };
}

/**
 * Site-wide blocks (WebSite + SearchAction, NewsMediaOrganization) —
 * rendered on every page by BaseLayout, not per-template.
 */
export function siteWideJsonLd(): JsonLdObject[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      ...newsMediaOrganization(),
    },
  ];
}

/**
 * Every category on this site is inherently time-sensitive (AI News,
 * Software News, Big Tech, Startups & Funding, ...) — unlike the
 * guides-site original this was forked from, there's no non-news
 * category to branch on, so this always resolves to NewsArticle.
 */
export function articleSchemaType(): "NewsArticle" {
  return "NewsArticle";
}

/**
 * Per-article NewsArticle block. `post.data.coverImage` must already be
 * resolved image metadata (true for any post reached via
 * getCollection/getStaticPaths in a page template).
 *
 * `lastVerifiedDate` is the real dateModified signal (src/lib/last-verified.ts,
 * pulled from the post's own git history, added in Phase 7) — falling
 * back to datePublished when a file has no commit history yet is
 * correct, but silently claiming every post was "modified" on its
 * publish date forever, even after a real correction, is the kind of
 * quiet lie that erodes exactly the trust signal this field exists to
 * provide — more load-bearing for a news site than a guides site.
 *
 * `additionalImageSrcs` are pre-generated 4x3 and 1x1 crops of the same
 * cover image (built in [category]/[slug].astro via getImage(), Phase 7)
 * — Google's Article structured data guidelines recommend supplying
 * 16x9, 4x3, and 1x1 versions of the same image "for best results."
 */
export function articleJsonLd(
  post: CollectionEntry<"blog">,
  pageUrl: string,
  lastVerifiedDate: Date | null,
  additionalImageSrcs: string[] = [],
): JsonLdObject {
  const authorEntry = person();
  const node: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": articleSchemaType(),
    headline: post.data.title,
    description: post.data.description,
    image: [
      absoluteUrl(post.data.coverImage.src),
      ...additionalImageSrcs.map(absoluteUrl),
    ],
    datePublished: post.data.date.toISOString(),
    dateModified: (lastVerifiedDate ?? post.data.date).toISOString(),
    publisher: newsMediaOrganization(),
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    inLanguage: "en-US",
    articleSection: getCategoryName(post.data.category),
    wordCount: countWords(post.body ?? ""),
  };
  if (authorEntry) node.author = authorEntry;
  if (post.data.tags.length > 0) node.keywords = post.data.tags.join(", ");
  return node;
}

/**
 * ItemList block for a page whose main content is a list of posts (the
 * homepage's Popular Now / category rails) — tells crawlers explicitly
 * that the page enumerates these specific articles, rather than leaving
 * that implicit in the rendered card grid. `urls` should already be
 * absolute.
 */
export function itemListJsonLd(urls: string[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: urls.map((url, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url,
    })),
  };
}

/**
 * CollectionPage block for a page whose content is a listing of posts
 * rather than a single article — category archives and tag archives.
 */
export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export { absoluteUrl };
