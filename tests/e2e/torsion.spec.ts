import { expect, test } from "@playwright/test";

test("catalogue → tutorial → solve → next → catalogue", async ({ page }) => {
  await page.goto("/games/");
  const link = page.getByRole("link", { name: "Jouer à TORSION" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/games\/play\/torsion\/$/);
  await expect(page.getByTestId("game-status")).toHaveText("À TOI DE JOUER");
  await page.getByTestId("pivot-5").click();
  await expect(page.getByTestId("game-status")).toHaveText("ATELIER RÉSOLU");
  await expect(page.getByTestId("turns")).toHaveText("01 TOUR");
  await page.getByRole("button", { name: "Atelier suivant" }).click();
  await expect(page.getByTestId("stage-index")).toHaveText("02 / 12");
  await page.getByTestId("pivot-10").click();
  await page.getByTestId("pivot-6").click();
  await expect(page.getByTestId("game-status")).toHaveText("ATELIER RÉSOLU");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
});

test("keyboard, undo, restart and save restoration work", async ({ page }) => {
  await page.goto("/games/play/torsion/");
  const pivot = page.getByTestId("pivot-5");
  await pivot.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("game-status")).toHaveText("ATELIER RÉSOLU");
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByTestId("game-status")).toHaveText("À TOI DE JOUER");
  await expect(page.getByTestId("turns")).toHaveText("00 TOURS");
  await page.getByRole("button", { name: "Recommencer" }).click();
  await expect(page.getByTestId("turns")).toHaveText("00 TOURS");
  await page.reload();
  await expect(page.getByTestId("stage-select")).toHaveValue("0");
  await page.getByTestId("stage-select").selectOption("1");
  await expect(page.getByTestId("stage-index")).toHaveText("02 / 12");
  await page.reload();
  await expect(page.getByTestId("stage-index")).toHaveText("02 / 12");
});

test("small viewport keeps rotation controls accessible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/games/play/torsion/");
  await expect(page.getByTestId("pivot-5")).toBeVisible();
  await page.getByTestId("pivot-5").click();
  await expect(page.getByTestId("game-status")).toHaveText("ATELIER RÉSOLU");
  await expect(page.getByTestId("back-home")).toBeVisible();
});
