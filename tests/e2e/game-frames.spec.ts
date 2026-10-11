import { expect, test } from "@playwright/test";

const games = [
  "snake",
  "les-absents",
  "pulse",
  "rebond",
  "lisiere",
  "torsion",
  "nuage",
  "veille",
] as const;

test("the published games use a clear, consistent outer frame without changing navigation", async ({
  page,
}) => {
  for (const slug of games) {
    await page.goto("/games/play/" + slug + "/");
    const back = page.getByTestId("back-home");
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute("href", "../../");
    const appearance = await page.evaluate(() => ({
      color: getComputedStyle(document.body).backgroundColor,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(appearance.color, slug).toBe("rgb(247, 248, 245)");
    expect(appearance.scrollWidth, slug).toBeLessThanOrEqual(
      appearance.viewport + 1,
    );
  }
});

test("the complete collection remains navigable at phone size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const slug of games) {
    await page.goto("/games/play/" + slug + "/");
    await expect(page.getByTestId("back-home")).toBeVisible();
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(horizontalOverflow, slug).toBe(false);
  }
});

test("the keyboard return remains visible in reduced-motion mode", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/games/play/torsion/");
  const back = page.getByTestId("back-home");
  await back.focus();
  await expect(back).toBeFocused();
  await expect(back).toHaveCSS("border-top-left-radius", "999px");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/games\/$/);
});
