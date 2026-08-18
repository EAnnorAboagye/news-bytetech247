import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
  },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Lighthouse CI gates on the mobile preset — re-run the a11y suite at
    // a mobile viewport too, since it's viewport-agnostic by nature.
    // Scoped via testMatch rather than a second full project: any spec
    // hardcoding desktop-only nav selectors would fail on a real,
    // intentional layout difference (the mobile disclosure nav) rather
    // than a regression. Ported from bytetech247.com's own playwright
    // config; rename the testMatch pattern once the actual a11y spec
    // file exists (Phase 12 of the build plan).
    {
      name: "mobile-chrome-a11y",
      testMatch: /.*a11y\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
});
