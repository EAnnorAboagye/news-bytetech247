import { describe, it, expect } from "vitest";
import { calculateReadingTime } from "../../src/lib/reading-time";

// Ported verbatim from bytetech247.com — a small, pure function, but the
// code-vs-prose weighting is exactly the kind of logic that's easy to
// silently break in a later refactor without a test catching it.
describe("calculateReadingTime", () => {
  it("never returns less than 1 minute, even for a few words", () => {
    expect(calculateReadingTime("just a few words here")).toBe(1);
  });

  it("scales prose at ~200 words per minute", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("excludes fenced code blocks from the prose word count", () => {
    const code =
      "```js\n" +
      Array(60).fill("word word word word word").join("\n") +
      "\n```";
    expect(calculateReadingTime(code)).toBeLessThanOrEqual(3);
  });

  it("still counts code-only content towards reading time via line count", () => {
    const code = "```js\n" + Array(80).fill("line();").join("\n") + "\n```";
    expect(calculateReadingTime(code)).toBeGreaterThanOrEqual(2);
  });

  it("combines prose and code weighting for mixed content", () => {
    const prose = Array(200).fill("word").join(" ");
    const code = "```js\nconsole.log(1);\n```";
    const proseOnly = calculateReadingTime(prose);
    const mixed = calculateReadingTime(`${prose}\n\n${code}`);
    expect(mixed).toBeGreaterThanOrEqual(proseOnly);
  });
});
