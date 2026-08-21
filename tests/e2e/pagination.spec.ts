import { test, expect } from "@playwright/test";

// Functional coverage for Astro's paginate() — the first real use
// anywhere in this codebase family (build plan Phase 8). ai-news has
// more posts than the pageSize of 12 specifically so /ai-news/2/ is a
// real, permanent route in production, not a route that only existed
// during a one-off manual verification. The exact page-2 count below
// tracks however many ai-news posts exist beyond the first 12 — update
// it whenever a new ai-news post ships (currently 14 total, 2 on page 2).
//
// Link locators are scoped to the Pagination <nav> specifically, not a
// bare page-wide name match — every seed post's cover image alt text
// starts with "Placeholder cover image for...", and "Placeholder"
// itself contains the substring "older" (P-L-A-C-E-H-**OLDER**), which
// made an unscoped getByRole("link", { name: /Older/i }) match every
// single post card on the page instead of the one real pagination
// link. Caught live running this suite for the first time.
test.describe("Category pagination", () => {
  test("page 1 shows 12 posts and links forward to page 2", async ({
    page,
  }) => {
    await page.goto("/ai-news/");
    await expect(page.locator(".post-card-wrapper")).toHaveCount(12);
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    const olderLink = pagination.getByRole("link", { name: /Older/i });
    await expect(olderLink).toHaveAttribute("href", "/ai-news/2/");
    await expect(pagination.getByRole("link", { name: /Newer/i })).toHaveCount(
      0,
    );
  });

  test("page 2 shows the remaining posts and links back to page 1", async ({
    page,
  }) => {
    await page.goto("/ai-news/2/");
    await expect(page.locator(".post-card-wrapper")).toHaveCount(2);
    const pagination = page.getByRole("navigation", { name: "Pagination" });
    const newerLink = pagination.getByRole("link", { name: /Newer/i });
    await expect(newerLink).toHaveAttribute("href", "/ai-news/");
    await expect(pagination.getByRole("link", { name: /Older/i })).toHaveCount(
      0,
    );
  });

  test("page 2 canonicalizes to itself, not to page 1", async ({ page }) => {
    await page.goto("/ai-news/2/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute(
      "href",
      "https://news.bytetech247.com/ai-news/2/",
    );
  });

  test("a category with fewer than 12 posts has no pagination controls", async ({
    page,
  }) => {
    await page.goto("/startups/");
    await expect(page.locator(".post-card-wrapper")).toHaveCount(5);
    await expect(
      page.getByRole("navigation", { name: "Pagination" }),
    ).toHaveCount(0);
  });
});
