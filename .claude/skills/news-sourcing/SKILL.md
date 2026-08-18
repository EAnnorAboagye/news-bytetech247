---
name: news-sourcing
description: Discover fresh (<48h) tech news candidates across news.bytetech247.com's six categories via Google News RSS search and official company/outlet blog feeds, shortlist them for approval, then hand each approved story to news-article for drafting. Stops for explicit approval before drafting and again before anything is committed/pushed. Use when asked to find news to cover, run a news scan, or start a new coverage cycle with no story already in hand.
---

This is the stage that runs _before_ `news-article` — it answers "what should we actually be covering
right now," across categories, without a story already in hand. It does not draft anything itself: it
discovers and shortlists real, dated news, then hands each approved story to `news-article` unchanged,
and stops before publish. Same shape as bytetech247.com's `content-planner` → `write-article` chain,
tuned for hard news instead of evergreen keywords.

## 1. Resolve inputs before searching

**Defaults apply silently — don't ask the user to confirm these at the start of a run.** Only stop and
ask if the user's own request already named a different scope for this run (e.g. "just check ai-news"
or "find me 2").

- **Category scope** — default to scanning all six (`src/config.ts`'s `CATEGORY_SLUGS`): `ai-news`,
  `software-news`, `electronics`, `automobile`, `big-tech`, `startups`. The user can narrow to one or
  more.
- **Candidate count** — default up to 5 per run, minimum 1. Never pad the shortlist to hit 5 — a real
  2-story shortlist beats a stretched 5-story one.
- **Freshness window — 48 hours, not a round "recent."** This isn't an arbitrary choice: it matches
  `src/pages/news-sitemap.xml.ts`'s own Google News sitemap window, already live on this site. A story
  outside that window is either already stale for News surfacing or belongs in a different kind of
  post entirely, not a fresh-news candidate. Check the real, dated source — never the sandbox's system
  clock — against actual calendar time.

## 2. Discovery — two channels, not a fixed feed list

A hardcoded list of per-company RSS URLs goes stale — companies add, drop, and move feeds, and a
6-category tech beat covers far more companies than any fixed list would name. Use two channels
instead, both live at scan time:

- **Google News RSS search** (primary) — no API key required:
  `https://news.google.com/rss/search?q=<query>&hl=en-US&gl=US&ceid=US:en`. Build `<query>` from the
  category's actual scope in `CATEGORY_DESCRIPTIONS` (`src/config.ts`), not a generic category name —
  e.g. for `startups`, search rounds/launches/acquisitions language, not the bare word "startups"; for
  `big-tech`, search leadership/acquisition/earnings language scoped to the named companies that
  category actually covers. Run a handful of distinct queries per category rather than one broad one —
  broad queries return noise, narrow ones return the actual news hook.
- **A small set of stable general-tech outlet feeds** (secondary, cross-category safety net) — feeds
  like TechCrunch's, The Verge's, and Ars Technica's main RSS feeds are long-stable and worth checking
  directly for anything Google News' index missed. Verify a feed URL actually resolves before relying
  on it in a given run — don't assume a URL from a prior run is still correct without checking; feeds
  do get restructured.
- **Confirm every candidate's actual primary source** before shortlisting — fetch the linked article
  (or the company's own announcement it's reporting on) directly rather than shortlisting off an RSS
  title/snippet alone. This is where a real WebFetch/browse step earns its place: an RSS feed tells you
  something exists, it doesn't tell you whether a primary source backs it or whether the headline
  overstates the actual news.

## 3. Apply `news-article`'s own bars before shortlisting

Don't shortlist a story that would fail `news-article` §1 the moment it got there — check cheaply here
first:

- **Real news hook**: something specifically changed, not an evergreen "company does X" restated.
- **Category fit** checked against `CATEGORY_DESCRIPTIONS` (`src/config.ts`), not against which search
  query happened to surface it — a candidate found while scanning `ai-news` queries can still turn out
  to actually be a `startups` story (an AI company's funding round) or a `big-tech` story (an AI
  company's leadership change).
- **A real primary source exists, or the exact secondary-source situation is known** — `news-article`
  §1 requires stating this before drafting; capture it now so the shortlist entry already has it.

## 4. Collision check

Before finalizing the shortlist, check both:

- `src/content/blog/*/index.mdx` frontmatter (`title`, `tags`, `category`) for a story already
  covered — including the 33 placeholder-fixture posts (`.claude/skills/news-article/SKILL.md` §8):
  if a placeholder's invented headline happens to match a real story found here, that's the slot to
  fill, not a duplicate to flag.
- `.claude/content-plans/discovered-news.md` (this skill's own log, §6 below) for a story already
  shortlisted in a prior run that hasn't been acted on yet.

Drop any candidate that collides.

## 5. Present the shortlist and stop

Output, per candidate (1-5 total):

```
STORY: <the actual news hook, one sentence>
CATEGORY: <slug>
SOURCE: <exact source> — <real date, within 48h>
PRIMARY SOURCE: <confirmed — link it> OR <relying on secondary reporting from X, no primary public yet>
WHY THIS CLEARS THE FRESHNESS BAR: <the specific detail, not "seems relevant">
```

This is a request for approval, not a request to start drafting — say so explicitly. Wait for the user
to approve specific stories (or all, or none) before moving to step 6.

## 6. Log the shortlist

Write (or update) `.claude/content-plans/discovered-news.md`:

```
# Discovered News Log

## <date of this run>
- **<story>** (<category>) — Source: <source + date> — Status: shortlisted
```

Update each entry's Status as it moves: `shortlisted` → `approved` → `drafted` (at which point the
real post's slug is the source of truth for its progress) → `rejected` (keep the row rather than
deleting it, so it isn't re-surfaced next run without a reason visible) → `stale` (if a shortlisted-but-
not-yet-approved story ages out of the 48h window before the user gets to it — don't silently drop it,
mark it and let a future run's freshness check decide whether a follow-up angle still applies).

## 7. Hand off approved stories — unchanged downstream skill

For each approved story, invoke `news-article` exactly as documented there, with this story's confirmed
facts, source, and category as its input. `news-article`'s own structure, attribution/hedging
discipline, and its full "before calling a draft done" checklist stand unmodified — this skill does not
pre-fill or skip any of that. Hand off one story at a time.

## 8. Before anything is committed or pushed, stop again

Once approved stories are drafted, present a publish-readiness summary, not an assumption that
drafting-done means shipping-ready:

- Every file changed (new posts, any `relatedSlugs` wiring on sibling posts, any placeholder-fixture
  post that got replaced per `news-article` §8).
- Confirmation the standard verification suite passed (`npm run check`, `npm run test:unit`,
  `npm run build`).
- Any sourcing that couldn't be fully confirmed, flagged explicitly rather than silently shipped —
  matching `news-article` §1/§5's honesty requirement: an explicit "relying on secondary reporting"
  beats a confident-sounding primary-source claim that isn't real.

Wait for explicit approval before running `git add`/`commit`/`push`. A shortlist approval upstream
doesn't substitute for a final look at what's actually about to go live — same hard gate
`content-planner` applies on bytetech247.com, for the same reason: this is exactly the kind of pipeline
step where an unreviewed draft is the failure mode, not a hypothetical one.

## 9. A known limit, stated honestly

Google News RSS search and a handful of stable outlet feeds are free and require no API key, which
fits this site's single-editor, cost-conscious model — but they're not a guaranteed-complete news feed.
A dedicated news API (GNews, NewsAPI.org, Bing News Search) would give broader, more structured
coverage at the cost of a paid subscription and a new credential to manage. Not worth adding unless the
free channels above prove genuinely insufficient in practice — flag it as a future option, don't build
it speculatively.

## 10. Before handing the shortlist back, check every one of these

- [ ] Category scope resolved (all six, or the ones the user specified).
- [ ] 1-5 stories shortlisted, never padded to hit the max.
- [ ] Every story has a real, dated source inside the 48-hour window, checked against real calendar
      time, not the sandbox date.
- [ ] Every story's primary-source status is known and stated (confirmed source linked, or an explicit
      note that it relies on secondary reporting) — not left implicit.
- [ ] Every story would plausibly clear `news-article` §1's own bar (real hook, correct category), not
      just "seems newsy."
- [ ] `src/content/blog` (including placeholder-fixture posts) and
      `.claude/content-plans/discovered-news.md` were checked for real collisions, not assumed clear.
- [ ] The log file was written or updated for this run.
- [ ] Output makes clear this is a shortlist for approval, not a request to start drafting.
- [ ] Downstream, `news-article` is invoked unmodified — its own checklist isn't skipped or pre-filled
      on the user's behalf.
- [ ] Nothing gets committed or pushed without a final, explicit publish approval after drafting is
      done.
