import { test, expect } from "@playwright/test";

// Functional/a11y coverage for the Live Wire ticker — genuinely new UI
// with no bytetech247.com analog (build plan Phase 3/6), flagged there
// as carrying real accessibility risk that deserved explicit e2e
// coverage rather than an assumption.
test.describe("Live Wire ticker", () => {
  test("the duplicate loop copy is hidden from the accessibility tree", async ({
    page,
  }) => {
    await page.goto("/");
    const duplicateList = page.locator(".ticker__list--duplicate");
    await expect(duplicateList).toHaveAttribute("aria-hidden", "true");
    // Every link inside the duplicate copy must be unreachable by
    // keyboard — a real link there would create a confusing second tab
    // stop for the same story.
    const duplicateLinks = duplicateList.locator("a");
    const count = await duplicateLinks.count();
    for (let i = 0; i < count; i++) {
      await expect(duplicateLinks.nth(i)).toHaveAttribute("tabindex", "-1");
    }
  });

  test("the real copy's links are keyboard-focusable and navigate", async ({
    page,
  }) => {
    // Reduced motion stops the marquee's CSS animation (see the third
    // test below) — needed here too, otherwise Playwright's actionability
    // check never sees the link as "stable" while it's continuously
    // translating and the click times out. Caught live running this
    // suite for the first time.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const realLinks = page.locator(
      ".ticker__list:not(.ticker__list--duplicate) a",
    );
    const firstLink = realLinks.first();
    await expect(firstLink).not.toHaveAttribute("tabindex", "-1");
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/\//g, "\\/")));
  });

  test("animation stops under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const track = page.locator(".ticker__track");
    const animationName = await track.evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animationName).toBe("none");
  });
});
