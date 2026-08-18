// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { visit } from "unist-util-visit";

// GFM tables don't emit scope="col" on <th> by default — needed for
// accessibility/AI-GEO parsing of tabular content. GFM only ever puts
// <th> in the header row, so every <th> is safely a column header.
// Ported verbatim from bytetech247.com's astro.config.mjs — general
// a11y behavior, not guide-content-specific.
function rehypeTableHeaderScope() {
  /** @param {import("hast").Root} tree */
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "th") {
        node.properties = { ...node.properties, scope: "col" };
      }
      if (node.tagName === "table") {
        node.properties = { ...node.properties, tabIndex: 0 };
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://news.bytetech247.com",
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
    // rehypeQuickAnswer and rehypeInArticleAds (bytetech247.com's guide-
    // specific/ad-injection plugins) are deliberately not ported here —
    // the news article template drops the Quick Answer pattern entirely,
    // and its own ad-slot positions haven't been designed yet (Phase 7 of
    // the build plan). Add a news-appropriate in-article-ads plugin there
    // once those slot keys exist, rather than carrying this one over
    // unexamined.
    rehypePlugins: [rehypeTableHeaderScope],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
