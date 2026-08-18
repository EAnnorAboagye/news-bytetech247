---
name: news-article
description: Draft or revise a ByteTech247 News post (MDX) — sourced hard-news reporting plus a clearly labeled "Why it matters" analysis section — so it reads as professional journalism and earns search/AI-answer-engine visibility. One skill covers all six categories (ai-news, software-news, electronics, automobile, big-tech, startups); category judgment lives inside this file rather than six separate skill files, so every post reads as the same publication regardless of beat. Use whenever asked to write, draft, expand, or edit a post in src/content/blog.
---

Every post reports something that actually changed, sourced to where it came from, then tells the
reader what it means. Those are two different jobs and this site never lets them blur into one
paragraph: the reporting states what happened and who said so; a separately headed section carries
the judgment. A reader should be able to tell, sentence by sentence, whether they're reading a
confirmed fact or this site's read on it.

## 1. Before writing a single sentence

- **Name the news hook in one line**: what specifically changed, and why is today the day this
  publishes? "Company X uses AI" is not news; "Company X shipped Y on \[date], replacing Z" is. If
  the hook is actually a week old, say so honestly in the lead rather than writing around it to sound
  same-day.
- **Confirm the category** is exactly one of the six in `src/config.ts`'s `CATEGORY_SLUGS`: `ai-news`,
  `software-news`, `electronics`, `automobile`, `big-tech`, `startups`. Check the story against that
  file's `CATEGORY_DESCRIPTIONS`, not against vibes — a funding round for an AI company is `startups`
  (the round is the news), not `ai-news` (that's for model/lab/policy news). A phone launch is
  `electronics`, not `big-tech`, even if the phone-maker is a big-tech company — `big-tech` is for
  leadership, acquisitions, and earnings, not product launches. If a story genuinely straddles two
  categories, pick the one the _news hook itself_ belongs to, not the one with the biggest brand name
  in it.
- **State what's confirmed versus still developing**, before drafting. A primary source (the
  company's own announcement, a filing, a direct quote, an official changelog) makes a claim
  reportable as fact. Anything short of that — a rumor, an unnamed-source report, an inference from
  circumstantial signals — gets attributed as such in the story, never upgraded to a bare declarative
  sentence because it reads more confidently that way.
- **Have a real primary source in hand**, or know exactly which secondary outlet you're relying on
  and say so. `editorial-policy.astro`'s Sourcing section makes this a public promise, not just a
  style preference: link the primary source where one exists; state explicitly when a report leans on
  another outlet's reporting because no primary source is public yet.

## 2. Structure, top to bottom

1. **Title** — the news itself, not a teaser. **60 characters or fewer, no exceptions** —
   `src/content.config.ts` enforces this as a build error. Name the actor and the action ("Google
   Ships Gemini 3.6 With Longer Context Windows"), not a vague hook ("Google's Big AI Update").
2. **Meta description (frontmatter `description`)** — one sentence stating the concrete news fact,
   written for the SERP snippet. **160 characters or fewer, no exceptions**, build-enforced same as
   the title.
3. **Lead (first paragraph, inverted pyramid)** — the whole story compressed: who did what, when, and
   the one number or detail that matters most, in the first sentence or two. No throat-clearing, no
   scene-setting before the news. This is the paragraph a search snippet or AI answer engine quotes
   verbatim — if it doesn't stand alone as the answer, it isn't done. Never open with a fabricated
   dateline (`SAN FRANCISCO —`) implying on-the-ground presence this operation doesn't have; see
   §5 below.
4. **Reporting body (`##`/`###`)** — the facts, in the order a reader needs them (usually: what
   happened, then the concrete details/numbers, then the immediate reaction or context). Every
   non-obvious claim carries its attribution inline ("according to the company's blog post," "per the
   filing," "\[Person], \[title], said in a statement") — not because it's a style rule, but because an
   unattributed claim in a news story reads as this site's own assertion, and most of what's in this
   section isn't. One fact-thread per paragraph; short, declarative sentences.
5. **"Why it matters" section (the commentary, done properly)** — a separate `##` heading, always
   present, always after the reporting: `## Why it matters` (or a genuinely more specific label for
   this story, e.g. `## What this means for developers`). Everything under this heading is this
   site's read: context, comparison to what came before, what to watch next, what's still unproven.
   This is where judgment belongs — and _only_ here. See §3 for how to write it so it reads as
   informed analysis, not disguised opinion or padded speculation.
6. **Citations** — the primary source linked inline, at the point in the reporting section where the
   claim it backs is made, not batched into a "sources" list at the end.
7. **Internal links (2-4)** — placed inline where the connection is real: a prior story on the same
   company/product, the story's own category index (`/{category}/`), a relevant tag page. Reinforces
   the site's own hub structure the way `related-posts.ts`/`recent-posts.ts` already surface
   mechanically below the fold — inline links are the ones a reader actually clicks mid-read.
8. **Closing** — one real "what to watch next" line (a date, a decision still pending, a follow-up
   this site will track), never a restatement of the lead. If the Why it matters section already said
   it, don't say it again here.

## 3. Attribution and hedging — where the professionalism actually lives

This is the discipline that separates "commentary done properly" from an unlabeled opinion dressed up
as news, and it's graded on two axes: **where** a judgment appears, and **how confidently** it's
phrased.

- **Confirmed fact → declarative sentence, in the reporting section.** "Google shipped Gemini 3.6 on
  August 17" — stated plainly, because it's sourced.
- **This site's inference or judgment → hedged language, confined to Why it matters.** "This likely
  puts pressure on \[competitor] to..." / "...suggests Google is prioritizing..." / "The bigger signal
  here is..." — hedge words (`likely`, `suggests`, `could`, `the real test will be`) are not weak
  writing in this section; they're the honest signal that this is analysis, not reporting. Removing
  every hedge from a Why it matters paragraph to make it sound punchier is how commentary quietly
  becomes misattributed fact — don't do it.
- **Never let a hedge leak backward into the reporting section**, and never let a bare declarative
  claim leak forward into Why it matters. If a sentence in the reporting section needs a hedge to be
  honest, it isn't confirmed yet — attribute it properly or cut it, don't launder it into the analysis
  section instead.
- **Speculation about the future belongs only in Why it matters**, explicitly framed as this site's
  forecast, never stated as if it were already true.

## 4. Sentence, paragraph, and phrasing rules

- **Short sentences, active voice, one fact or one point per sentence.** Vary sentence length
  deliberately — a run of same-length sentences is a known statistical tell of generated text.
- **Paragraphs stay short: 2-4 sentences**, one point each, in both the reporting and analysis
  sections.
- **Specificity over generalization.** A real number, a real date, a real quote — never "significant
  update" or "major development" standing in for the actual detail.
- **Human dashes only. No em dash (`—`) anywhere in prose** — use a hyphen, a comma, or split into two
  sentences. Exception: a real, verbatim quoted string that itself contains one — preserve a quote
  exactly, never edit it to satisfy house style.
- **Banned on sight** (each a known tell of generated or padded copy): "In today's fast-paced world,"
  "game-changer," "revolutionize," "it remains to be seen" used as filler rather than an honest open
  question, "sources say" without naming what kind of source, "breaking" attached to something that
  isn't, "In conclusion"/"To sum up," any sentence in the reporting section that could describe
  literally any company's announcement if you swapped the name out.

## 5. What this operation honestly is — apply this before claiming any authority signal

news.bytetech247.com is edited by one person (`siteConfig.author.name`, see `src/config.ts`) reporting
on already-public developments — not a newsroom with reporters physically present at briefings or
launch events. Every claim of authority in a post has to be true to that:

- **Never fabricate first-hand presence** — no "we tested," "our team attended," or a dateline
  implying someone was physically on-site, unless that's literally true. The honest version of
  "Experience" for this site is: did you actually read the primary source document, watch the actual
  announcement video, or read the actual filing yourself — not a secondhand summary of it. State that
  directly ("per the company's own announcement post") rather than implying more than that.
- **Expertise** shows up as exact detail — version numbers, dollar figures, exact product names, dates
  — not vaguer paraphrase.
- **Authoritativeness** is the primary-source link itself (§1, §2.6) — link the company's own
  post/filing/changelog, not a secondary outlet's summary of it, whenever the primary source exists.
- **Trustworthiness** is `editorial-policy.astro`'s actual public promise: independence (no story
  written because a company asked for it; no undisclosed sponsored content), and honest corrections
  (`LastVerified.astro` reads `dateModified` straight from this file's real git history via
  `getLastVerifiedDate()` — a post-publish fix to a wrong figure shows up there automatically; never
  quietly edit a factual error without letting that field reflect it, and never delete a published
  story to avoid acknowledging a mistake in it).

## 6. Cover image sourcing

This site doesn't source from Pexels at all — generic stock photography reads as filler on a story
about a specific company/product, and there's no `PEXELS_API_KEY` provisioned in this repo. Default
path for every post: a **bespoke AI-generated illustration**, run through
`scripts/generate-conceptual-cover.mjs` (Cloudflare Workers AI, `flux-1-schnell`):

```bash
node scripts/generate-conceptual-cover.mjs <post-folder>/cover.jpg "<subject prompt>"
```

**The prompt must be written fresh, per story, from that story's actual facts — never a fixed
template reused across a category.** The failure mode this guards against is real: if every `ai-news`
post gets some variant of "glowing neural network, interconnected nodes," the covers stop being
distinguishable from each other and stop telling the reader anything about _this_ story. Instead,
derive the concrete visual metaphor from what the story specifically is:

- "Foldable laptop displays past crease problem" → a folding, hinging plane of light — not a generic
  "electronics" icon.
- "Solid-state battery EV enters production" → a stylized battery-cell cross-section merging into a
  vehicle silhouette — not a generic "EV" icon.
- "\[Startup] raises \$40M Series B" → an abstract upward-growth motif tied to that startup's actual
  product category (dev tooling, climate tech, fintech — whatever it specifically is), not a generic
  "money" or "rocket" image reused for every funding story.

Two things stay consistent across a category on purpose, and only these two: pull the category's
`--category-accent-*` OKLCH hue (`src/styles/global.css`) into the prompt's color language so posts in
the same category read as one family at a glance, and keep the illustration style abstract (per the
negative-constraint suffix the script always appends) rather than photorealistic. Everything else —
subject, composition, motif — has to be specific to that one story.

**Never name the real company/product in a way that pushes the model to reproduce its logo or exact
product design** — describe the abstract visual metaphor instead ("a folding plane of light," not "a
\[Brand] \[Product] laptop"). The script's negative suffix already blocks logos/brand marks and
photorealism structurally; the positive half of the prompt shouldn't work against that.

**Open the generated image and check it by eye before committing** — confirm there's no garbled
pseudo-text or logo-like artifact (a known diffusion-model failure mode the negative suffix reduces
but doesn't guarantee against). Regenerate with an adjusted prompt if there is.

**Override with a real official image only when one is clearly the better, lower-risk choice** — a
company's own press-kit product shot or an executive headshot from their newsroom, credited via
`coverImageCredit: { name, url }` pointing at the source. This is the exception, not the default; when
in doubt, generate.

**Never generate or use an image that could pass as a real screenshot of an announcement, tweet,
product UI, or filing, and never a photorealistic render that could pass as an actual product photo.**
For a guide site a fabricated "screenshot" is misleading; for a news site either failure mode is a
real misinformation risk — a reader has no way to tell a fabricated image from a real one, and this
site's entire credibility rests on not being the source of that confusion. `validate-cover-image.ts`
still requires ≥1600×900 (16:9) regardless of source.

## 7. Frontmatter contract

Matches `src/content.config.ts` exactly — nothing more, nothing less:

`title` (≤60 chars) · `description` (≤160 chars) · `date` · `category` (one of the six slugs above) ·
`tags` (array, default `[]`) · `relatedSlugs` (array, default `[]` — set when a genuinely related
prior post exists) · `coverImage` (local `./cover.jpg`, never a hotlinked remote URL) · `coverImageAlt`
(required, describes what the image actually shows) · `coverImageCredit` (optional, Pexels/press-image
only — omit entirely rather than fabricate one).

No `faq`, no `series`/`seriesOrder` — those fields don't exist on this schema; they're
`write-article`/bytetech247.com-only.

## 8. Replacing a placeholder fixture post

The 33 seed posts under `src/content/blog/` were committed as structural placeholders (Phase 5 of the
build), each with a body reading literally "Placeholder fixture post — Phase 5 seed content..." and a
`coverImageAlt` starting "Placeholder cover image for...". When turning one of these into a real post:

- Treat it as a full rewrite, not a rewording. The placeholder's `title`/`category`/`slug` were
  invented to _sound_ plausible for seeding pagination and layout testing — verify the actual news
  still holds (or find the real current story for that slot) before trusting any of that frontmatter
  as fact. Don't just replace the body text under an unverified title.
- Replace `coverImage`/`coverImageAlt`/`coverImageCredit` following §6 — the placeholder cover is a
  solid-color fixture, not a real image, and must not survive into a published post.
- Once real, `date` should be the actual first-publish date of the real story, not the placeholder's
  seed date.

## 9. Before calling a draft done, check every one of these

- [ ] Category is one of the six real slugs, checked against `CATEGORY_DESCRIPTIONS` in `config.ts`,
      not chosen by vibes.
- [ ] Title ≤60 chars (count it), states the actual news, not a teaser.
- [ ] Description ≤160 chars (count it), states the concrete fact.
- [ ] Lead answers who/what/when in the first sentence or two, no throat-clearing, no fabricated
      dateline.
- [ ] Every non-obvious claim in the reporting section carries inline attribution to its real source.
- [ ] A `## Why it matters` (or equivalently labeled) section exists, appears after the reporting, and
      contains this site's judgment — nowhere else in the post.
- [ ] Every sentence in Why it matters that's inference or forecast is hedged (`likely`, `suggests`,
      `could`); nothing there reads as a bare confirmed fact.
- [ ] Nothing hedged appears in the reporting section, and nothing declarative-as-fact appears in Why
      it matters.
- [ ] 1+ primary source linked inline at the claim it backs; if none exists, the post says explicitly
      it's relying on another outlet's reporting.
- [ ] 2-4 internal links placed inline, not batched at the end.
- [ ] No em dash in the prose; no banned phrase from §4 survived.
- [ ] No claim of first-hand presence, testing, or attendance that isn't literally true.
- [ ] Cover image is a bespoke AI-generated illustration with a prompt authored fresh from this
      story's actual facts (not a reused per-category template), or a credited official press image
      where that's clearly the better call — checked by eye for garbled pseudo-text/logo artifacts,
      and never a fabricated "screenshot" or photorealistic fake product photo.
- [ ] Frontmatter matches §7 exactly — no `faq`, no `series`/`seriesOrder`.
- [ ] If this replaces a placeholder fixture post, every placeholder field (body, cover, credit,
      possibly title/date) was actually verified or replaced, not left half-real.
- [ ] No `# ` (H1) in the body — the page title is the only H1
      (`src/lib/validate-no-h1-in-body.ts` enforces this at build time).
- [ ] Read it once as only a reader: can you tell, at every point, whether you're reading a fact or
      this site's opinion of it? If any sentence is ambiguous on that question, it isn't done.
