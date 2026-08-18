import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// axe-core run against every real page template on this site, zero
// violations — same pattern as bytetech247.com's phase6-a11y.spec.ts,
// with this site's own real routes. Includes /ai-news/2/ specifically:
// ai-news has 13 seed posts against a pageSize of 12 (Phase 12 added 9
// extra posts just to make this a real route, not a hypothetical one)
// — pagination is new to this codebase family (Phase 8/9) and deserves
// its own a11y coverage, not just the unpaginated page 1 shape.
const routes = [
  "/",
  "/ai-news/",
  "/ai-news/2/",
  "/software-news/",
  "/electronics/",
  "/automobile/",
  "/big-tech/",
  "/startups/",
  "/ai-news/gpt-6-preview-launches-with-agent-mode/",
  "/tag/openai/",
  "/archive/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/editorial-policy/",
];

test.describe("Accessibility (axe-core)", () => {
  for (const route of routes) {
    test(`no a11y violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test("custom 404 page has no a11y violations", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});
