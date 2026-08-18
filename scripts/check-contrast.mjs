import { wcagContrast, formatHex } from "culori";

// Candidate token values — OKLCH(L, C, H). Neutral hue+chroma matches
// bytetech247.com's own (same cool-grey family, brand cohesion); accent
// hue is deliberately different (25, warm red-orange) so the two
// properties read as distinct at a glance while staying visually related.
const NEUTRAL_H = 250;
const NEUTRAL_C = 0.012;
const ACCENT_H = 25;
const LINK_H = 260; // same as bytetech247.com — link-blue is a UX convention, not a brand color

const CATEGORY_HUES = {
  "ai-news": 290,
  "software-news": 135,
  electronics: 225,
  automobile: 355,
  "big-tech": 55,
  startups: 185,
};

const base = {
  light: {
    bg: { l: 0.985, c: NEUTRAL_C, h: NEUTRAL_H },
    bgSubtle: { l: 0.955, c: NEUTRAL_C, h: NEUTRAL_H },
    border: { l: 0.64, c: NEUTRAL_C, h: NEUTRAL_H },
    fgMuted: { l: 0.46, c: NEUTRAL_C, h: NEUTRAL_H },
    fg: { l: 0.19, c: NEUTRAL_C, h: NEUTRAL_H },
    accent: { l: 0.46, c: 0.11, h: ACCENT_H },
    accentFg: { l: 0.98, c: NEUTRAL_C, h: NEUTRAL_H },
    link: { l: 0.5, c: 0.19, h: LINK_H },
  },
  dark: {
    bg: { l: 0.15, c: NEUTRAL_C, h: NEUTRAL_H },
    bgSubtle: { l: 0.2, c: NEUTRAL_C, h: NEUTRAL_H },
    border: { l: 0.5, c: NEUTRAL_C, h: NEUTRAL_H },
    fgMuted: { l: 0.68, c: NEUTRAL_C, h: NEUTRAL_H },
    fg: { l: 0.96, c: NEUTRAL_C, h: NEUTRAL_H },
    accent: { l: 0.78, c: 0.12, h: ACCENT_H },
    accentFg: { l: 0.15, c: NEUTRAL_C, h: NEUTRAL_H },
    link: { l: 0.75, c: 0.14, h: LINK_H },
  },
};

function hex(t) {
  return formatHex({ mode: "oklch", l: t.l, c: t.c, h: t.h });
}

function check(mode, label, aTok, bTok, threshold) {
  const a = hex(aTok);
  const b = hex(bTok);
  const ratio = wcagContrast(a, b);
  const pass = ratio >= threshold;
  console.log(
    `[${mode}] ${label.padEnd(38)} ${a} vs ${b}  ratio=${ratio.toFixed(2)}  need>=${threshold}  ${pass ? "PASS" : "FAIL"}`,
  );
  return pass;
}

let allPass = true;
for (const mode of ["light", "dark"]) {
  const t = base[mode];
  allPass = check(mode, "fg on bg (body text)", t.fg, t.bg, 4.5) && allPass;
  allPass =
    check(mode, "fgMuted on bg (large text only)", t.fgMuted, t.bg, 3.0) &&
    allPass;
  allPass =
    check(mode, "accent on bg (link text)", t.accent, t.bg, 4.5) && allPass;
  allPass =
    check(mode, "link on bg (citation link text)", t.link, t.bg, 4.5) &&
    allPass;
  allPass =
    check(
      mode,
      "accentFg on accent (button/badge text)",
      t.accentFg,
      t.accent,
      4.5,
    ) && allPass;
  allPass =
    check(mode, "border vs bg (non-text UI 3:1)", t.border, t.bg, 3.0) &&
    allPass;

  // Category badges: accentFg text sits directly on each category-accent
  // background (PostCard.astro's .post-card__badge) — same 4.5:1 text
  // requirement as the main accent button, tested per category hue.
  const catC = mode === "light" ? 0.11 : 0.12;
  const catL = mode === "light" ? 0.46 : 0.78;
  for (const [slug, h] of Object.entries(CATEGORY_HUES)) {
    const catAccent = { l: catL, c: catC, h };
    allPass =
      check(
        mode,
        `accentFg on --category-accent-${slug}`,
        t.accentFg,
        catAccent,
        4.5,
      ) && allPass;
  }
}

console.log("\nHex values:");
for (const mode of ["light", "dark"]) {
  console.log(mode, "accent:", hex(base[mode].accent));
  const catC = mode === "light" ? 0.11 : 0.12;
  const catL = mode === "light" ? 0.46 : 0.78;
  for (const [slug, h] of Object.entries(CATEGORY_HUES)) {
    console.log(`  ${slug}:`, hex({ l: catL, c: catC, h }));
  }
}

console.log(
  allPass
    ? "\nALL REQUIRED PAIRINGS PASS"
    : "\nSOME PAIRINGS FAIL — adjust lightness/chroma",
);
