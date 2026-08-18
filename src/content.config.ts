import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORY_SLUGS } from "./config";

// News-post frontmatter schema — forked from bytetech247.com's blog
// collection, with the guide-specific fields dropped (see the build
// plan's Phase 1): no series/seriesOrder (pillar-cluster nav a news post
// doesn't have) and no faq (an evergreen-guide pattern, not a news-post
// one). Invalid frontmatter fails the build here, not silently at
// render time.
//
// coverImage's dimension/aspect-ratio requirements are NOT checked here
// — Astro's content-layer image() field only stores a deferred marker at
// schema-parse time, real width/height isn't resolved until later. See
// src/lib/validate-cover-image.ts (Phase 5), called from the article
// page's getStaticPaths() once post.data.coverImage is fully resolved.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      // Capped at 60 chars — past that, Google truncates the title in
      // search snippets and it stops fitting a browser tab/SERP link
      // cleanly.
      title: z.string().max(60, "Title must be 60 characters or fewer"),
      // Capped at 160 chars — same reasoning, for meta descriptions.
      description: z
        .string()
        .max(160, "Description must be 160 characters or fewer"),
      date: z.coerce.date(),
      category: z.enum(CATEGORY_SLUGS),
      tags: z.array(z.string()).default([]),
      // Manual related-posts override, shown first and capped — filled
      // out automatically by tag-overlap scoring otherwise (Phase 7).
      relatedSlugs: z.array(z.string()).default([]),
      coverImage: image(),
      // alt describes the image; caption (per-usage, in the Figure
      // component) gives context/attribution — not interchangeable.
      coverImageAlt: z
        .string()
        .min(1, "coverImageAlt is required and cannot be empty"),
      // Only present when the cover is a sourced/wire photo — omitted
      // entirely for an original screenshot/photo, never fabricated.
      coverImageCredit: z
        .object({ name: z.string(), url: z.string().url() })
        .optional(),
    }),
});

export const collections = { blog };
