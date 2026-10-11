import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("shows the actual course concept and hit feedback", async ({ page }) => {
  await page.goto("/games/play/nuage/");
  await expect(page.getByTestId("chapter-concept")).toHaveText(
    "01 · SAUT PRÉCIS",
  );
  await page.locator("body").press("Space");
  await expect(page.getByTestId("incident")).toContainText("Encre touchée", {
    timeout: 7000,
  });
  await expect(page.getByTestId("game-status")).toContainText("REPRISES");
});

test("airborne second jump is unlocked later and works with keyboard", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "games:nuage:progress-v1",
      JSON.stringify({
        unlocked: 3,
        selected: 3,
        finished: ["rose", "orange", "jaune"],
        collected: {},
        promenade: false,
      }),
    );
  });
  await page.goto("/games/play/nuage/");
  await expect(page.getByTestId("chapter-concept")).toContainText(
    "DOUBLE SAUT",
  );
  await page.locator("body").press("Space");
  await page.locator("body").press("Space");
  await expect(page.getByTestId("ability")).toContainText("2e SAUT DISPONIBLE");
  await page.locator("body").press("Space");
  await expect(page.getByTestId("ability")).toContainText("2e SAUT UTILISÉ");
});

test("later chapters display the new hazards on a mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "games:nuage:progress-v1",
      JSON.stringify({
        unlocked: 6,
        selected: 6,
        finished: ["rose", "orange", "jaune", "vert", "bleu", "violet"],
        collected: {},
        promenade: true,
      }),
    );
  });
  await page.goto("/games/play/nuage/");
  await expect(page.getByTestId("chapter-concept")).toContainText(
    "GRANDE AURORE",
  );
  await expect(page.getByText("Fossé : franchis en l'air")).toBeVisible();
  await expect(page.getByTestId("jump")).toBeVisible();
  await page.getByTestId("jump").tap();
  await expect(page.getByTestId("game-status")).toContainText("EN ROUTE");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
});
