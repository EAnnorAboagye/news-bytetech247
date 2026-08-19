import type { CollectionEntry } from "astro:content";

// Seed/fixture posts (news-article SKILL.md §8) ship with a body that
// starts with this exact marker instead of real reporting. Confirmed live
// bug this guards against: a placeholder's frontmatter `date` is set once
// at seed time and never bumped, so as real time passes one can silently
// drift inside the Google News sitemap's 48-hour window and get
// advertised to Google as fresh news while its body still reads
// "Placeholder fixture post — Phase N seed content...". Every discovery
// surface — sitemap.xml, rss.xml, the per-category feeds, news-sitemap.xml
// — excludes placeholders using this; the page itself still builds and is
// directly linkable (pagination/layout testing still needs it to exist),
// only the "here's what's new" signals hide it until it's replaced with
// real content.
const PLACEHOLDER_MARKER = "Placeholder fixture post";

export function isPlaceholderPost(post: CollectionEntry<"blog">): boolean {
  return (post.body ?? "").includes(PLACEHOLDER_MARKER);
}
