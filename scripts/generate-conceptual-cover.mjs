// Generates a post's cover image via Cloudflare Workers AI
// (@cf/black-forest-labs/flux-1-schnell). Ported from bytetech247.com's
// script of the same name, but this is the DEFAULT cover-sourcing path
// for news-article (see .claude/skills/news-article/SKILL.md §6), not a
// fallback used only when stock photography doesn't fit — this site
// doesn't source from Pexels at all. Not part of the build — run
// manually per post:
//   node scripts/generate-conceptual-cover.mjs <outfile> "<prompt>"
//
// The <prompt> must be authored fresh for the specific story being
// illustrated (its actual product category, sector, and the concrete
// visual metaphor that fits it), never a fixed template reused across
// every post in a category — see SKILL.md §6 for why a repeated "AI
// network glowing" image on every ai-news post defeats the point of
// leaving Pexels behind.
//
// Scope, matching SKILL.md §6: ABSTRACT/ILLUSTRATIVE imagery only —
// never a screenshot, terminal capture, chart, or anything that could be
// mistaken for a real captured artifact, and never a photorealistic
// render that could pass as an actual product photo — on a guide site
// that's a minor fib, on a news site it's a real misinformation risk.
// Diffusion models also reliably render garbled pseudo-text when a
// prompt implies any text/UI/logo element, so every generation is forced
// through a fixed negative-constraint suffix below rather than trusting
// each caller's prompt wording to avoid it.
//
// Requires CLOUDFLARE_API_TOKEN (Workers AI permission) and
// CLOUDFLARE_ACCOUNT_ID in `.dev.vars` — a local-authoring-only
// credential, distinct from the CLOUDFLARE_API_TOKEN GitHub Actions
// secret that deploys the Worker (that one's scoped for Workers deploy,
// not necessarily Workers AI inference). See `.dev.vars.example`.
//
// flux-1-schnell takes no width/height parameter — it always returns a
// 1024x1024 square, confirmed against the live API, not just its docs.
// validate-cover-image.ts requires >=1600x900 (16:9), so every output is
// run through sharp's cover-fit resize below: a ~1.56x upscale-and-crop
// to a real 1600x900 JPEG. That's a one-time cost paid once here, not on
// every downstream crop Astro generates from it later — the site's own
// getImage() calls (4x3, 1x1, preload) all resize down from this file,
// so Astro's own withoutEnlargement default never enlarges past what
// this script already produced.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const [, , outFile, prompt] = process.argv;

if (!outFile || !prompt) {
  console.error(
    'Usage: node scripts/generate-conceptual-cover.mjs <outfile> "<prompt>"',
  );
  process.exit(1);
}

function readDevVar(name) {
  if (!existsSync(".dev.vars")) {
    console.error(
      ".dev.vars not found. Copy .dev.vars.example to .dev.vars and fill in CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID.",
    );
    process.exit(1);
  }
  const contents = readFileSync(".dev.vars", "utf8");
  const match = contents.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!match) {
    console.error(`${name} not set in .dev.vars.`);
    process.exit(1);
  }
  return match[1].trim();
}

const apiToken = readDevVar("CLOUDFLARE_API_TOKEN");
const accountId = readDevVar("CLOUDFLARE_ACCOUNT_ID");

// Forced on every call — never left to the caller's prompt wording. Keeps
// this script's output structurally incapable of being mistaken for a
// real screenshot, chart, captured data, or an actual product photo,
// regardless of what the subject-matter prompt asks for. The
// photorealism clause is stricter than bytetech247.com's original: a
// news site's cover is more likely to be read as "this is what the
// thing looks like" than a guide site's, so it has to fail toward
// obviously-illustrated rather than toward photorealistic.
const NEGATIVE_SUFFIX =
  ", abstract digital illustration style, flat or gradient shapes, not photorealistic, not a real photograph, no readable text, no words, no letters, no user interface, no screenshot, no terminal window, no code, no charts, no data visualization, no logos, no brand marks";

const fullPrompt = `${prompt}${NEGATIVE_SUFFIX}`;
if (fullPrompt.length > 2048) {
  console.error(
    `Prompt too long after appending the required negative-constraint suffix (${fullPrompt.length} chars, max 2048). Shorten the subject prompt.`,
  );
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: fullPrompt, steps: 8 }),
});

if (!response.ok) {
  console.error(
    `Workers AI request failed: ${response.status} ${response.statusText}`,
  );
  console.error(await response.text());
  process.exit(1);
}

const body = await response.json();
if (!body.success || !body.result?.image) {
  console.error("Workers AI response missing an image:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

const rawImage = Buffer.from(body.result.image, "base64");
const resized = await sharp(rawImage)
  .resize(1600, 900, { fit: "cover", position: "centre" })
  .jpeg({ quality: 90 })
  .toBuffer();

writeFileSync(outFile, resized);
console.log(
  `Wrote ${outFile} (1600x900, resized from the model's native 1024x1024)`,
);
console.log(`Prompt used: ${fullPrompt}`);
