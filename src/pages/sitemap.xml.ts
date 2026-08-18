import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig, CATEGORIES } from "../config";
import { postUrl } from "../lib/rss";
import { getLastVerifiedDate } from "../lib/last-verified";

// Dynamic, build-time-generated sitemap — every static route plus every
// post, with accurate per-post lastmod. Forked from bytetech247.com's
// sitemap.xml.ts, minus the /tools/ static path and TOOLS loop (no
// tools section on this site).
//
// Paginated category/tag pages (Phase 8/9) are deliberately NOT listed
// here beyond their own page-1 entry (already covered by the CATEGORIES
// loop below) — Google discovers subsequent pages via each page's own
// prev/next links, the common practice for paginated archives, not by
// enumerating every page in the sitemap.
//
// /archive/, /tag/*, and the legal pages (contact, privacy, terms,
// editorial-policy) are deliberately absent — they all carry
// <meta name="robots" content="noindex, follow">, and a sitemap should
// only ever list URLs you actually want indexed.
//
// /about/ is NOT in that noindex group: every article's Person JSON-LD
// names /about/ as the author's canonical authority page, so telling
// Google not to index the exact page that schema points at as the
// credential source would directly contradict the E-E-A-T signal the
// rest of the site builds.
const STATIC_PATHS: { path: string; file: string }[] = [
  { path: "/", file: "src/pages/index.astro" },
  { path: "/about/", file: "src/pages/about.astro" },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");

  const maxDate = (candidates: Date[]): Date | null =>
    candidates.length === 0
      ? null
      : new Date(Math.max(...candidates.map((d) => d.getTime())));

  // Real lastmod per post, from the file's own git history — not the
  // frontmatter `date` field, which is set once at drafting time and
  // never bumped when a post is later edited.
  const postLastmod = new Map(
    posts.map((post) => [
      post.id,
      getLastVerifiedDate(`src/content/blog/${post.id}/index.mdx`) ??
        post.data.date,
    ]),
  );

  const homepageLastmod = maxDate([...postLastmod.values()]);

  const entries = [
    ...STATIC_PATHS.map(({ path, file }) => {
      const lastmod =
        path === "/" ? homepageLastmod : getLastVerifiedDate(file);
      return {
        loc: `${siteConfig.url}${path}`,
        lastmod: lastmod?.toISOString(),
      };
    }),
    ...CATEGORIES.map((category) => {
      const lastmod = maxDate(
        posts
          .filter((post) => post.data.category === category.slug)
          .map((post) => postLastmod.get(post.id)!),
      );
      return {
        loc: `${siteConfig.url}/${category.slug}/`,
        lastmod: lastmod?.toISOString(),
      };
    }),
    ...posts.map((post) => ({
      loc: postUrl(post),
      lastmod: postLastmod.get(post.id)!.toISOString(),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>${
        entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""
      }\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
