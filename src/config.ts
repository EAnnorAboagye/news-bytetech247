// Single source of truth for site identity — same pattern as
// bytetech247.com's src/config.ts. Every later SEO/OG/JSON-LD/RSS module
// reads from here — never redeclare these values in a template.

export const CATEGORY_SLUGS = [
  "ai-news",
  "software-news",
  "electronics",
  "automobile",
  "big-tech",
  "startups",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

// Slugs and names match the published "News Site Blueprint" artifact
// exactly — permanent once the first post ships and Google indexes a URL.
const CATEGORY_NAMES: Record<CategorySlug, string> = {
  "ai-news": "AI News",
  "software-news": "Software News",
  electronics: "Tech Electronics",
  automobile: "Tech Automobile",
  "big-tech": "Big Tech & Industry Moves",
  startups: "Startups & Funding",
};

const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  "ai-news":
    "Model releases, lab announcements, and AI policy — reported as it happens.",
  "software-news":
    "Product launches, major updates, and dev-platform changes across the software world.",
  electronics:
    "Hardware and gadget news — launches and events, not buying guides.",
  automobile: "EVs, autonomous driving, and automotive software.",
  "big-tech":
    "Apple, Google, Microsoft, Meta, and the rest of big tech — leadership, acquisitions, earnings.",
  startups: "Rounds, launches, and acquisitions in the startup layer.",
};

export const CATEGORIES: { slug: CategorySlug; name: string }[] =
  CATEGORY_SLUGS.map((slug) => ({
    slug,
    name: CATEGORY_NAMES[slug],
  }));

export function getCategoryName(slug: string): string {
  return CATEGORY_NAMES[slug as CategorySlug] ?? slug;
}

export function getCategoryDescription(slug: string): string {
  return (
    CATEGORY_DESCRIPTIONS[slug as CategorySlug] ??
    `All ${getCategoryName(slug)} posts.`
  );
}

export const siteConfig = {
  name: "ByteTech247 News",
  url: "https://news.bytetech247.com",
  title: "ByteTech247 News | Fast, Sourced Tech & AI Coverage",
  description:
    "Fast, sourced tech news covering AI, software, electronics, automotive, big tech, and startups, corrected transparently when a detail changes.",
  author: {
    // Same operator as bytetech247.com — see build history there.
    name: "Aboagye Annor",
    bio: "Founder and editor of ByteTech247 News. Covers AI, software, and big tech with sourced, dated reporting — corrections are issued transparently when a detail changes.",
  },
  // Reusing bytetech247.com's existing accounts — this is the same brand
  // family and no dedicated news-only accounts exist yet. Swap these if/
  // when news.bytetech247.com gets its own handles.
  social: {
    facebook: "https://www.facebook.com/bytetech247",
    x: "https://x.com/bytetech247",
    instagram: "https://www.instagram.com/bytetech247",
    tiktok: "https://www.tiktok.com/@bytetech247",
  } as Record<string, string>,

  // logoImage: real 512x512 publisher logo (public/logo-512.png,
  // generated from the site's own logo-mark.svg), feeds
  // NewsMediaOrganization's `logo` field in json-ld.ts — this is what
  // lets Google News/Discover results show a real publisher mark instead
  // of nothing. defaultOgImage is still null (no dedicated 1200x630
  // social-share image generated yet) — a safe no-op, not a placeholder
  // to forget about; generate one before that's needed.
  defaultOgImage: null as string | null,
  logoImage: "/logo-512.png" as string | null,

  // Reusing bytetech247.com's working inbox — a dedicated tips@ or
  // news@ address would need its own Cloudflare Email Routing forward
  // set up first; better to point at a real, working address now than a
  // dedicated-sounding one that silently bounces.
  contactEmail: "info@bytetech247.com",
  contactFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeeZu9cdFWVJcncLjnrSG6Xyou-ndQNjynnQ7HeXmVwe3MJcw/viewform",

  // Same operator, same jurisdiction as bytetech247.com.
  jurisdiction: "Ghana",

  // This domain's own dedicated GA4 property, created inside the same
  // GA account that manages bytetech247.com — a separate property with
  // its own measurement ID, not bytetech247.com's own analyticsId (an
  // earlier value here, G-QCK9SYFM29, actually was bytetech247.com's ID
  // reused, which would have merged both sites' traffic into one stream
  // with no clean way to see either site's numbers alone). Updated again
  // 2026-08-20 to G-ZF8PK9Y0SR — the previous ID (G-5M08757CWB) was
  // never actually live on production, so GA's own tag-detection check
  // reported no tracking code found on the index page at all.
  analyticsId: "G-ZF8PK9Y0SR",

  // Same reasoning as analyticsId — a Cloudflare Web Analytics beacon
  // token is generated per-site in the dashboard once the zone exists.
  // Reusing bytetech247.com's token here would misattribute analytics
  // data to the wrong property, not just look like a placeholder.
  cloudflareBeaconToken: "",

  // Same AdSense account as bytetech247.com — confirmed, the 9 real
  // homepage ad-unit IDs below were created under this exact publisher.
  adsensePublisherId: "ca-pub-2225877475261768",

  // Flip to true once AdSense shows this domain as connected/approved.
  // Until then, BaseLayout doesn't load adsbygoogle.js or activate any
  // slot at all — not just a revenue no-op, but a real CLS bug: an
  // unapproved/unfilled slot's data-ad-format="auto" +
  // data-full-width-responsive="true" still resizes the <ins> element
  // asynchronously on astro:page-load (after initial layout), and that
  // resize can exceed the CSS min-height reserved for it. Confirmed via
  // a live CI run — Lighthouse measured 0.2565 CLS on the homepage
  // (9 stacked slots, one right at the top) against a 0.1 budget,
  // identically on two separate commits that touched nothing about the
  // homepage. AdSlot.astro's own comment assumed reserved min-height was
  // sufficient on its own; it isn't, once the script actually runs.
  adsenseApproved: false,

  // Manual AdSense ad-unit slot IDs (see src/components/AdSlot.astro).
  // AdSlot renders nothing for an empty string, so the 3 article-page
  // keys stay a safe no-op until real AdSense units are created for
  // them — creating those units is outside what this build can do
  // itself (see the AdSense API research earlier this project).
  adSlots: {
    homepageHeader: "8054858603",
    homepageAfterHero: "9176368583",
    homepageAfterPopularNow: "3924041909",
    homepageAfterAiNews: "2312361155",
    homepageAfterSoftwareNews: "9999279485",
    homepageAfterElectronics: "1429740501",
    homepageAfterAutomobile: "2061808669",
    homepageAfterBigTech: "6492008260",
    homepageAfterStartups: "1238168813",
    // Article-page positions (Phase 7) — not yet backed by real AdSense
    // units. Three, not bytetech247.com's eight: no pillar-cluster nav,
    // Quick Answer box, or per-H2 rehype insertion exist on this site's
    // shorter news-post template, so there's no "mid-body" position to
    // hang an ad on the way the guides-site original does.
    articleHeader: "",
    articleAfterLead: "",
    articleBeforeRelated: "",
  } as Record<string, string>,
} as const;

// Maps each category slug to the siteConfig.adSlots key for the ad slot
// that follows its homepage rail — kept here rather than inline in
// index.astro so the mapping stays next to the adSlots keys it has to
// match. Same pattern as bytetech247.com's CATEGORY_HOMEPAGE_AD_SLOT.
export const CATEGORY_HOMEPAGE_AD_SLOT: Record<CategorySlug, string> = {
  "ai-news": "homepageAfterAiNews",
  "software-news": "homepageAfterSoftwareNews",
  electronics: "homepageAfterElectronics",
  automobile: "homepageAfterAutomobile",
  "big-tech": "homepageAfterBigTech",
  startups: "homepageAfterStartups",
};
