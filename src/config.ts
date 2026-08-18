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
    "ByteTech247 News covers AI, software, big tech, and startups — fast, sourced reporting on what's actually moving in tech today.",
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

  // No dedicated OG/logo assets generated yet for this property — null
  // here is a safe no-op (matches bytetech247.com's own `string | null`
  // contract for these two fields), not a placeholder to forget about.
  // Generate real 1200x630 OG art and a square logo mark before launch.
  defaultOgImage: null as string | null,
  logoImage: null as string | null,

  // Reusing bytetech247.com's working inbox — a dedicated tips@ or
  // news@ address would need its own Cloudflare Email Routing forward
  // set up first; better to point at a real, working address now than a
  // dedicated-sounding one that silently bounces.
  contactEmail: "info@bytetech247.com",
  contactFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeeZu9cdFWVJcncLjnrSG6Xyou-ndQNjynnQ7HeXmVwe3MJcw/viewform",

  // Same operator, same jurisdiction as bytetech247.com.
  jurisdiction: "Ghana",

  // Left empty until a dedicated GA4 property exists for this domain —
  // same "safe no-op until a real ID exists" convention as adSlots below.
  // Do not reuse bytetech247.com's analyticsId; it would misattribute
  // this site's traffic to the wrong GA4 property.
  analyticsId: "",

  // Same reasoning as analyticsId — a Cloudflare Web Analytics beacon
  // token is generated per-site in the dashboard once the zone exists.
  // Reusing bytetech247.com's token here would misattribute analytics
  // data to the wrong property, not just look like a placeholder.
  cloudflareBeaconToken: "",

  // Same AdSense account as bytetech247.com — confirmed, the 9 real
  // homepage ad-unit IDs below were created under this exact publisher.
  adsensePublisherId: "ca-pub-2225877475261768",

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
