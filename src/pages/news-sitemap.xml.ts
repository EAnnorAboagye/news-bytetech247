import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../config";
import { postUrl } from "../lib/rss";
import { isPlaceholderPost } from "../lib/is-placeholder-post";

// Google News sitemap (build plan Phase 11 stretch goal — genuinely
// greenfield, no bytetech247.com equivalent since that site has no
// time-sensitive content). Separate from the general sitemap.xml on
// purpose: Google News sitemaps must contain ONLY articles published in
// the last 48 hours, using the news:news namespace, per Google's
// documented spec (developers.google.com/search/docs/crawling-indexing/
// sitemaps/news-sitemap). A URL ages out of this file 48 hours after
// publish — it stays perfectly indexable via the regular sitemap and
// NewsArticle schema, this file just stops re-advertising it as fresh
// news. No `Googlebot-News` robots.txt entry is needed alongside this —
// Google News crawls with the standard Googlebot.
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog");
  const cutoff = Date.now() - NEWS_WINDOW_MS;
  const recentPosts = posts
    .filter((post) => !isPlaceholderPost(post))
    .filter((post) => post.data.date.valueOf() >= cutoff)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const entries = recentPosts.map((post) => {
    const loc = postUrl(post);
    // news:publication_date should be the original publish time — the
    // real distinguishing signal a 48-hour freshness window depends on,
    // not the git-history-derived lastmod the general sitemap uses (that
    // reflects edits/corrections, a different concept from "when this
    // was first published").
    const publicationDate = post.data.date.toISOString();
    return `  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${siteConfig.name}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${escapeXml(post.data.title)}</news:title>
    </news:news>
  </url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
