import { describe, it, expect } from "vitest";
import { pageTitle } from "../../src/lib/seo";

// Ported verbatim from bytetech247.com. pageTitle backs every article's
// rendered <title>/og:title/twitter:title — content.config.ts caps a
// post's raw title at 60 chars so Google doesn't truncate it, but that
// check never sees the category suffix templates append, so this is the
// one place that guard actually has to hold for the real, final string.
describe("pageTitle", () => {
  it("appends the suffix when the combined string fits maxLength", () => {
    expect(pageTitle("Google Ships Gemini 3.6", "AI News")).toBe(
      "Google Ships Gemini 3.6 — AI News",
    );
  });

  it("returns the base title unchanged when there is no suffix", () => {
    expect(pageTitle("Some Title")).toBe("Some Title");
  });

  it("drops the suffix when appending it would exceed maxLength", () => {
    const longTitle =
      "EU Finalizes AI Act Enforcement Guidelines for AI Models"; // 57 chars
    // + " — Big Tech & Industry Moves" (29 chars) = 86, over the 60-char budget.
    expect(pageTitle(longTitle, "Big Tech & Industry Moves")).toBe(longTitle);
  });

  it("keeps the suffix exactly at the maxLength boundary", () => {
    const base = "b".repeat(35);
    const suffix = "s".repeat(22);
    expect(pageTitle(base, suffix, 60)).toBe(`${base} — ${suffix}`);
  });

  it("drops the suffix one character past the maxLength boundary", () => {
    const base = "b".repeat(35);
    const suffix = "s".repeat(23);
    expect(pageTitle(base, suffix, 60)).toBe(base);
  });
});
