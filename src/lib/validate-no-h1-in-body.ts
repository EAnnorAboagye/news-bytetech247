import type { CollectionEntry } from "astro:content";

const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
// Negative lookahead excludes ##/### etc. — only a bare single "#" heading.
const H1_PATTERN = /^#(?!#)\s+.+$/m;

/**
 * The page title (rendered by [category]/[slug].astro, outside the MDX
 * content) is the only H1 an article page ever has — every post body
 * must start its own sections at H2 or deeper. Throws (failing the
 * build) on violation. Code blocks are stripped first — a shell/Python
 * comment starting with "# " inside a fenced block isn't a markdown
 * heading. Ported verbatim from bytetech247.com.
 */
export function validateNoH1InBody(post: CollectionEntry<"blog">): void {
  const body = (post.body ?? "").replace(CODE_BLOCK_PATTERN, "");
  if (H1_PATTERN.test(body)) {
    throw new Error(
      `Post "${post.id}": body must not contain an H1 ("# ") heading — the page title is the only H1. Start body sections at H2 ("##") or deeper.`,
    );
  }
}
