// Pings Google's Indexing API with every URL in the just-built sitemap
// — the Google-side counterpart to submit-indexnow.mjs. Ported verbatim
// from bytetech247.com; the new domain only changes what's in the
// sitemap this reads, not the script itself.
//
// Requires the service account to be added as an Owner on this property
// in Search Console (a separate, new property from bytetech247.com's —
// Settings -> Users and permissions) — the API call fails with a
// permissions error otherwise, not a silent no-op.
//
// Reads the full downloaded service-account JSON key from
// GOOGLE_INDEXING_SERVICE_ACCOUNT (the whole file's contents as one
// secret). Never commit that file or print its contents.
import { readFileSync } from "node:fs";
import {
  loadServiceAccountCredentials,
  getAccessToken,
} from "./lib/google-service-account.mjs";

const INDEXING_ENDPOINT =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";
const SCOPE = "https://www.googleapis.com/auth/indexing";

const credentials = loadServiceAccountCredentials();

if (!credentials) {
  console.log(
    "GOOGLE_INDEXING_SERVICE_ACCOUNT not set — skipping Google Indexing API submission. " +
      "See scripts/submit-google-indexing.mjs for setup.",
  );
  process.exit(0);
}

// Same posture as bytetech247.com's own script, after that site
// actually hit the API's 200/day publish-request quota submitting every
// sitemap URL on every deploy — only resubmit what's actually new or
// recently changed.
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

try {
  const accessToken = await getAccessToken(credentials, SCOPE);
  let succeeded = 0;

  for (const url of urlList) {
    const response = await fetch(INDEXING_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });
    if (response.ok) {
      succeeded += 1;
    } else {
      console.error(
        `Google Indexing API: ${url} -> ${response.status} ${await response.text()}`,
      );
    }
  }

  console.log(
    `Google Indexing API: submitted ${succeeded}/${urlList.length} URLs`,
  );
} catch (error) {
  console.error(
    "Google Indexing API submission failed (non-fatal):",
    error.message,
  );
}
