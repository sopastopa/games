import { expect, test } from "@playwright/test";

test.use({ hasTouch: true });

test("portal → story → promenade completion → next chapter → portal", async ({
  page,
}) => {
  await page.goto("/games/");
  const link = page.getByRole("link", { name: "Jouer à NUAGE" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/games\/play\/nuage\/$/);
  await expect(page.getByTestId("story")).toContainText("Pip");
  await page.getByTestId("promenade").check();
  await page.getByTestId("jump").click();
  await expect(page.getByTestId("game-status")).toHaveText("CHAPITRE TERMINÉ", {
    timeout: 15000,
  });
  await expect(page.getByTestId("ending")).toBeVisible();
  await page
    .getByRole("button", { name: "Découvrir le chapitre suivant" })
    .click();
  await expect(page.getByTestId("chapter-index")).toHaveText("02 / 07");
  await expect(page.getByTestId("story")).toContainText("carnaval");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
});

test("normal mode has real ink collisions, pause, restart and keyboard action", async ({
  page,
}) => {
  await page.goto("/games/play/nuage/");
  await page.locator("body").press("Space");
  await expect(page.getByTestId("game-status")).toContainText("EN ROUTE");
  await expect(page.getByTestId("game-status")).toContainText("REPRISES", {
    timeout: 7000,
  });
  await page.locator("body").press("KeyP");
  await expect(page.getByTestId("game-status")).toHaveText("EN PAUSE");
  const before = await page.getByTestId("scene-progress").textContent();
  await page.waitForTimeout(200);
  await expect(page.getByTestId("scene-progress")).toHaveText(before ?? "");
  await page.getByRole("button", { name: "Rejouer" }).click();
  await expect(page.getByTestId("game-status")).toHaveText("PRÊT À PARTIR");
});

test("mobile input and saved accessibility setting survive reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/games/play/nuage/");
  await expect(page.getByTestId("jump")).toBeVisible();
  await page.getByTestId("promenade").check();
  await page.getByTestId("jump").tap();
  await expect(page.getByTestId("game-status")).toContainText("EN ROUTE");
  await page.reload();
  await expect(page.getByTestId("promenade")).toBeChecked();
  await expect(page.getByTestId("back-home")).toBeVisible();
});
