// Checks real Google crawl/index status per URL via the Search Console
// URL Inspection API. Ported verbatim from bytetech247.com, pointed at
// this domain's sitemap. Not part of CI/deploy — run manually, hours to
// days after a deploy:
//   GOOGLE_INDEXING_SERVICE_ACCOUNT="$(cat key.json)" GSC_SITE_URL="sc-domain:news.bytetech247.com" node scripts/check-index-status.mjs
import {
  loadServiceAccountCredentials,
  getAccessToken,
} from "./lib/google-service-account.mjs";

const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SITEMAP_URL = "https://news.bytetech247.com/sitemap.xml";

const credentials = loadServiceAccountCredentials();
if (!credentials) {
  console.log(
    "GOOGLE_INDEXING_SERVICE_ACCOUNT not set — skipping index status check. " +
      "See scripts/check-index-status.mjs for setup.",
  );
  process.exit(0);
}

const siteUrl = process.env.GSC_SITE_URL;
if (!siteUrl) {
  console.error(
    "GSC_SITE_URL not set. Check the property switcher in Search Console for " +
      'the exact value: a domain property is "sc-domain:news.bytetech247.com", ' +
      'a URL-prefix property is "https://news.bytetech247.com/" (trailing slash required).',
  );
  process.exit(1);
}

async function urlsFromArgsOrSitemap() {
  const argUrls = process.argv.slice(2);
  if (argUrls.length > 0) return argUrls;

  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SITEMAP_URL}: ${response.status}`);
  }
  const sitemap = await response.text();
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, loc]) => loc);
}

async function inspectUrl(accessToken, inspectionUrl) {
  const response = await fetch(INSPECT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(body)}`);
  }
  return body.inspectionResult.indexStatusResult;
}

try {
  const accessToken = await getAccessToken(credentials, SCOPE);
  const urls = await urlsFromArgsOrSitemap();

  let indexed = 0;
  let notIndexed = 0;

  for (const url of urls) {
    try {
      const result = await inspectUrl(accessToken, url);
      const isIndexed =
        result.verdict === "PASS" ||
        result.coverageState === "Submitted and indexed";
      if (isIndexed) {
        indexed++;
      } else {
        notIndexed++;
      }

      console.log(
        `${isIndexed ? "[INDEXED]" : "[PENDING]"} ${url}\n` +
          `  verdict=${result.verdict} coverage=${result.coverageState ?? "n/a"}\n` +
          `  lastCrawlTime=${result.lastCrawlTime ?? "never crawled"} pageFetch=${result.pageFetchState ?? "n/a"} robotsTxt=${result.robotsTxtState ?? "n/a"} indexing=${result.indexingState ?? "n/a"}`,
      );
    } catch (error) {
      notIndexed++;
      console.error(`[ERROR] ${url} -> ${error.message}`);
    }
  }

  console.log(
    `\nIndex status: ${indexed}/${urls.length} indexed, ${notIndexed}/${urls.length} not yet indexed or errored.`,
  );
} catch (error) {
  console.error("Index status check failed:", error.message);
  process.exit(1);
}
