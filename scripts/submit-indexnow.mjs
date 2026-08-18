// Pings IndexNow (Bing/Yandex) with every URL in the just-built sitemap,
// so they pick up new/changed posts without waiting for their own crawl
// schedule. Does NOT reach Google. Ported from bytetech247.com with a
// FRESH key — IndexNow's verification model is "whoever can host a file
// at this exact host controls the domain," so a key generated for
// bytetech247.com would not verify news.bytetech247.com; reusing it
// would just fail verification, not work.
//
// Run from CI, after a successful `wrangler deploy`. Not part of the
// build — can also be run manually: node scripts/submit-indexnow.mjs
import { readFileSync } from "node:fs";

const INDEXNOW_KEY = "22b3a55288667af102ae2f1620aa9b73";
const SITE_URL = "https://news.bytetech247.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const RECENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const now = Date.now();
const urlList = [
  ...sitemap.matchAll(
    /<url>\s*<loc>(.*?)<\/loc>(?:\s*<lastmod>(.*?)<\/lastmod>)?\s*<\/url>/g,
  ),
]
  .filter(
    ([, , lastmod]) =>
      !lastmod || now - new Date(lastmod).getTime() <= RECENT_WINDOW_MS,
  )
  .map(([, loc]) => loc);

if (urlList.length === 0) {
  console.error(
    "No recent URLs found in dist/sitemap.xml — nothing to submit.",
  );
  process.exit(0);
}

const host = new URL(SITE_URL).host;

try {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  console.log(
    `IndexNow: submitted ${urlList.length} URLs, status ${response.status}`,
  );
} catch (error) {
  // A failed ping is a missed SEO nicety, not a broken deploy — log it
  // and let CI continue rather than failing the job over a third-party
  // outage.
  console.error("IndexNow submission failed (non-fatal):", error.message);
}
