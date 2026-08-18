// Forked from bytetech247.com's worker/index.ts (build plan Phase 4) —
// CSP/nonce derivation, trailing-slash redirect, and markdown content
// negotiation ported verbatim. Dropped entirely: the view/reaction
// counter endpoint, the MCP Compatibility Checker + Lemon Squeezy
// payment handlers, and their COUNTERS_KV/SESSION_KV bindings — none of
// these are news-site requirements, and carrying them over speculatively
// is pure attack surface and KV cost for zero v1 benefit. Re-add
// handleCounter/isRateLimited/isAllowedOrigin verbatim from the source
// project (they're proven, self-contained) if a real feature ever needs
// them — see the build plan's Phase 4 note.
//
// This file is intentionally separate from the Astro build (the project
// stays output: 'static') rather than adding the @astrojs/cloudflare SSR
// adapter — article content is always static HTML from `env.ASSETS`,
// never rendered per-request.

import { CATEGORY_SLUGS } from "../src/config";

export interface Env {
  ASSETS: Fetcher;
  // Set once via `wrangler secret put CSP_NONCE_SECRET` — never committed.
  // See deriveNonce() below for what it's used for.
  CSP_NONCE_SECRET: string;
}

// A real per-request-unique CSP nonce would need every HTML response
// marked uncacheable, throwing away edge caching entirely. Deriving the
// nonce from a secret + a time bucket instead means every request within
// the same window — cached or freshly computed — agrees on the same
// value, so caching keeps working unmodified while the nonce still
// rotates periodically rather than staying fixed forever.
//
// 60 minutes, not 5: a real live-confirmed gap on bytetech247.com — the
// CSP header is only ever re-read by the browser on a real top-level
// navigation, but Astro's <ClientRouter /> serves most in-site link
// clicks as a client-side soft-navigation (a fetch() + DOM swap, no new
// navigation), which never applies the freshly-fetched response's own
// CSP header to the already-live document. A visitor who stays on the
// site past one rotation and then triggers a soft-navigation ends up
// with newly-inserted HTML stamped with a *different* nonce than the one
// the browser is still actually enforcing. A 5-minute window made that
// mismatch common on any real browsing session; 60 minutes doesn't
// eliminate the structural gap, but makes crossing it during a normal
// visit rare.
const NONCE_WINDOW_MS = 60 * 60 * 1000;

async function deriveNonce(secret: string): Promise<string> {
  const bucket = Math.floor(Date.now() / NONCE_WINDOW_MS);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(String(bucket)),
  );
  // base64url, no padding — '+', '/', '=' aren't valid inside a CSP
  // nonce-source token unquoted from the header's perspective, and this
  // is also going straight into an HTML attribute value.
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, 32);
}

// Google's own Publisher Tag docs are explicit that GPT/AdSense's
// ad-serving domains "change over time" and don't support a static
// host-allowlist CSP — they recommend nonce + 'strict-dynamic' instead.
// frame-src/img-src/connect-src widen to `https:` for the same reason:
// ad creatives, iframes, and measurement beacons span far more
// Google/ad-tech domains than can be safely enumerated. The actual XSS
// protection stays in script-src's nonce + strict-dynamic, which still
// blocks arbitrary injected script execution; widening the other
// directives only affects what ad *content* is allowed to render, a
// much lower-severity concern. require-trusted-types-for is left in
// place — the pass-through `default` Trusted Types policy already
// registered in BaseLayout.astro accepts any unqualified sink usage,
// which is exactly what AdSense's internal script injection will hit,
// the same way it already transparently covers Astro's own ClientRouter.
function cspFor(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https: http:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: data:`,
    `font-src 'self'`,
    `frame-src https:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `require-trusted-types-for 'script'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

// Tags every <script> element in an HTML response with the current
// nonce (first-party scripts and the AdSense loader alike) and sets the
// matching Content-Security-Policy header. No-ops for non-HTML
// responses.
function applyCsp(response: Response, nonce: string): Response {
  if (!response.headers.get("Content-Type")?.includes("text/html")) {
    return response;
  }
  const rewritten = new HTMLRewriter()
    .on("script", {
      element(el) {
        el.setAttribute("nonce", nonce);
      },
    })
    .transform(response);
  const headers = new Headers(rewritten.headers);
  headers.set("Content-Security-Policy", cspFor(nonce));
  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers,
  });
}

// Sitewide preference declaration (contentsignals.org / draft-romm-aipref-
// contentsignals), delivered only as a response header — Google added
// `content-signal` to its documented list of unsupported robots.txt
// directives in April 2026, so this stays a header only, never echoed in
// robots.txt.
const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

const ARTICLE_PATH = /^\/([a-z-]+)\/([a-z0-9-]+)\/?$/;

// Every real static-asset extension this site actually serves (public/,
// generated /_astro/ build output, and the dynamic .xml/.txt/.md
// routes) — an explicit allowlist, not a generic "ends in a dot plus
// alphanumerics" heuristic. That generic version would misfire on a real
// publishable slug shape like a post about a specific version (e.g.
// /ai-news/gpt-4.5-release, ".5-release" — or more simply a slug ending
// in a version number), silently skipping the trailing-slash redirect
// below for exactly the kind of URL it exists to fix.
const STATIC_ASSET_EXTENSION =
  /\.(xml|txt|md|png|jpe?g|webp|avif|svg|ico|css|js|json|woff2?|ttf)$/i;

// Every HTML page that has a real, already-published markdown
// counterpart — the homepage's is the sitewide llms.txt index
// (src/pages/llms.txt.ts, Phase 11), every article's is its own
// [category]/[slug].md route (Phase 7). Deliberately does NOT invent an
// alternate for category/tag index pages, which have no markdown export
// to point to.
export function resolveMarkdownAlternate(
  pathname: string,
): { path: string; type: string } | null {
  if (pathname === "/") {
    return { path: "/llms.txt", type: "text/plain" };
  }
  const match = pathname.match(ARTICLE_PATH);
  if (match) {
    const [, category, slug] = match;
    if ((CATEGORY_SLUGS as readonly string[]).includes(category)) {
      return { path: `/${category}/${slug}.md`, type: "text/markdown" };
    }
  }
  return null;
}

// Minimal RFC 7231 §5.3.2 Accept-header comparison: true only when the
// client names text/markdown with a q-value at or above text/html's
// (both default to q=1 when present with no q param, 0 when absent).
// Real browsers never send text/markdown at all, so this never fires for
// ordinary visitors — only for a client that explicitly asked for it.
export function prefersMarkdown(request: Request): boolean {
  const accept = request.headers.get("Accept");
  if (!accept) return false;

  const qualityOf = (mediaType: string): number => {
    for (const part of accept.split(",")) {
      const [range, ...params] = part
        .trim()
        .split(";")
        .map((s) => s.trim());
      if (range === mediaType) {
        const qParam = params.find((p) => p.startsWith("q="));
        const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
        return Number.isNaN(q) ? 1 : q;
      }
    }
    return 0;
  };

  const markdownQ = qualityOf("text/markdown");
  if (markdownQ <= 0) return false;
  return markdownQ >= qualityOf("text/html");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Computed once per request, reused at every HTML return point below
    // so a single response never mixes two different nonce values.
    const nonce = await deriveNonce(env.CSP_NONCE_SECRET);

    const alternate = resolveMarkdownAlternate(url.pathname);

    // Real Accept-based content negotiation (RFC 9110 §12), not a
    // suffix-only route: an agent that sends `Accept: text/markdown` to
    // the *article URL itself* now gets the markdown representation of
    // that same URL, instead of needing to already know the separate
    // `.md` path. Cache-Control: no-store on this branch only —
    // Cloudflare's edge cache keys on URL alone by default and ignores
    // Vary, so without this a markdown response fetched here could get
    // cached and then served back to a plain-HTML browser request for
    // the same URL (and vice versa). The `.md`/`llms.txt` assets it
    // fetches from are cheap, edge-local Workers Static Assets — never
    // an origin round trip — so disabling caching on just this branch
    // costs nothing.
    if (alternate && request.method === "GET" && prefersMarkdown(request)) {
      const markdownResponse = await env.ASSETS.fetch(
        new URL(alternate.path, url).toString(),
      );
      if (markdownResponse.ok) {
        const headers = new Headers(markdownResponse.headers);
        headers.set("Vary", "Accept");
        headers.set("Cache-Control", "private, no-store");
        headers.set("Content-Signal", CONTENT_SIGNAL);
        return new Response(markdownResponse.body, {
          status: markdownResponse.status,
          headers,
        });
      }
    }

    // Every internal link/canonical/sitemap URL this site generates
    // carries a trailing slash, but nothing previously enforced that at
    // the edge — a request that arrives without one still resolved fine
    // via Astro's default trailingSlash "ignore" mode, serving the same
    // content at two different URLs with no canonicalizing redirect
    // between either, a latent duplicate-content risk. Excludes /api/*
    // (none exist on this site yet, but the exclusion costs nothing and
    // matches the source project's contract if one is ever added), any
    // path whose last segment has a file extension (static assets), and
    // non-GET/HEAD requests.
    //
    // Deliberately placed *after* the markdown-negotiation branch above,
    // not before it: ARTICLE_PATH's own `\/?$` makes the trailing slash
    // optional specifically so an Accept: text/markdown request to an
    // article URL without one still gets a real markdown response.
    // Redirecting first would intercept that exact request shape with a
    // bare 301 before content negotiation ever ran, silently breaking it
    // for any client that doesn't auto-follow redirects.
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      !url.pathname.startsWith("/api/") &&
      // Pagefind's own build output (dist/pagefind/, generated by the
      // `pagefind --site dist` postbuild step) uses idiosyncratic
      // extensions of its own (.pagefind, .pf_meta, .pf_fragment, ...)
      // that STATIC_ASSET_EXTENSION never tried to enumerate. Excluded
      // wholesale, same as bytetech247.com does after a live incident
      // there: without this exclusion, a request for a Pagefind asset
      // gets 301'd to a URL with no matching asset, and pagefind.js's
      // own fetch calls don't expect a redirect there — breaks search
      // sitewide.
      !url.pathname.startsWith("/pagefind/") &&
      !url.pathname.endsWith("/") &&
      !STATIC_ASSET_EXTENSION.test(url.pathname)
    ) {
      const target = new URL(url);
      target.pathname = `${url.pathname}/`;
      return Response.redirect(target.toString(), 301);
    }

    const response = await env.ASSETS.fetch(request);

    // RFC 8288 Link response header, advertising the real markdown
    // alternate for agents that check headers before deciding whether to
    // fetch/parse the HTML body — only added where one genuinely exists.
    if (
      alternate &&
      response.headers.get("Content-Type")?.includes("text/html")
    ) {
      const headers = new Headers(response.headers);
      headers.append(
        "Link",
        `<${alternate.path}>; rel="alternate"; type="${alternate.type}"`,
      );
      headers.set("Content-Signal", CONTENT_SIGNAL);
      const existingVary = headers.get("Vary");
      headers.set("Vary", existingVary ? `${existingVary}, Accept` : "Accept");
      return applyCsp(
        new Response(response.body, {
          status: response.status,
          headers,
        }),
        nonce,
      );
    }

    return applyCsp(response, nonce);
  },
};
