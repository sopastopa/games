import { expect, test } from "@playwright/test";

const games = [
  { slug: "snake", board: "#board" },
  { slug: "les-absents", board: "#board" },
  { slug: "pulse", board: "#dial" },
  { slug: "rebond", board: "#board" },
  { slug: "lisiere", board: "#board" },
  { slug: "torsion", board: "#board" },
  { slug: "nuage", board: "#world" },
];

for (const { slug, board } of games) {
  test(`${slug} enters and exits fullscreen on desktop`, async ({ page }) => {
    await page.goto(`/games/play/${slug}/`);
    const toggle = page.getByTestId("fullscreen-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(board)).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.fullscreenElement === document.documentElement ||
          document.documentElement.classList.contains("game-fullscreen"),
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(board)).toBeVisible();
  });

  test(`${slug} remains playable in a narrow mobile fullscreen viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/games/play/${slug}/`);
    const toggle = page.getByTestId("fullscreen-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(board)).toBeVisible();
    const bounds = await page.locator(board).boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(120);
    expect(bounds!.width).toBeLessThanOrEqual(390);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
}
