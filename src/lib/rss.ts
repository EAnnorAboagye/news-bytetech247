import type { CollectionEntry } from "astro:content";
import { render } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getContainerRenderer as getMdxRenderer } from "@astrojs/mdx/container-renderer";
import { loadRenderers } from "astro:container";
import { siteConfig } from "../config";
import Figure from "../components/Figure.astro";

// Same mapping the article template passes to its own <Content /> — only
// Figure, per Phase 7's trimmed MDX component set (no Callout/CodeTabs/
// Benchmark on this site).
const MDX_COMPONENTS = { Figure };

// Hand-rolled RSS 2.0 rather than pulling in @astrojs/rss — shared by
// the sitewide and per-category feeds, no extra dependency to keep in
// sync. Ported from bytetech247.com's src/lib/rss.ts.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCdata(value: string): string {
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

export function postUrl(post: CollectionEntry<"blog">): string {
  return `${siteConfig.url}/${post.data.category}/${post.id}/`;
}

// Renders a post's full MDX body to an HTML string at build time via
// Astro's container API, so the feed can carry the full article
// (content:encoded), not just the 160-char meta description. Container
// instance + MDX renderer are expensive to set up — created once and
// reused across every post in a feed.
let containerPromise: ReturnType<typeof AstroContainer.create> | undefined;
async function getSharedContainer() {
  if (!containerPromise) {
    containerPromise = loadRenderers([getMdxRenderer()]).then((renderers) =>
      AstroContainer.create({ renderers }),
    );
  }
  return containerPromise;
}

// Ad markup would be baked into every post's compiled MDX at the shared,
// build-time content-layer pipeline if this site ever adds an in-article
// ad rehype plugin — stripped here regardless, since feed readers never
// load global.css or the AdSense script and would otherwise show an
// empty, unstyled "Advertisement" box while exposing the real AdSense
// publisher ID in public XML. Kept even though no such plugin exists yet
// (Phase 7 dropped it) — cheap insurance against exactly the kind of
// silent leak this fixed on bytetech247.com if one is ever added later.
function stripAdSlots(html: string): string {
  return html.replace(/<div class="ad-slot"[^>]*>[\s\S]*?<\/div>/g, "");
}

async function renderPostHtml(post: CollectionEntry<"blog">): Promise<string> {
  const { Content } = await render(post);
  const container = await getSharedContainer();
  const html = await container.renderToString(Content, {
    props: { components: MDX_COMPONENTS },
  });
  return stripAdSlots(html);
}

export async function buildRssFeed(options: {
  title: string;
  description: string;
  feedUrl: string;
  posts: CollectionEntry<"blog">[];
}): Promise<string> {
  const { title, description, feedUrl, posts } = options;

  const items = (
    await Promise.all(
      posts.map(async (post) => {
        const url = postUrl(post);
        let contentEncoded = "";
        try {
          const html = await renderPostHtml(post);
          contentEncoded = `\n      <content:encoded><![CDATA[${escapeCdata(html)}]]></content:encoded>`;
        } catch (err) {
          console.error(`rss: failed to render full content for ${url}`, err);
        }
        return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>${contentEncoded}
      <pubDate>${post.data.date.toUTCString()}</pubDate>
    </item>`;
      }),
    )
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
