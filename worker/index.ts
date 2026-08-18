// Placeholder Worker — plain passthrough to the static asset binding.
// The real CSP/nonce derivation, trailing-slash redirect, and markdown
// content-negotiation logic (ported from bytetech247.com's worker/index.ts)
// lands in Phase 4 of the build plan. This stub exists only so
// wrangler.toml's `main` resolves and `npm run check` has something to
// type-check during Phase 0's scaffold.

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
