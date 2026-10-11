import { expect, test } from "@playwright/test";

test("the strategy game appears in Games, starts and returns to the portal", async ({ page }) => {
  await page.goto("/games/");
  const link = page.getByRole("link", { name: "Jouer à LISIÈRE" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/games\/play\/lisiere\/$/);
  await expect(page.getByRole("heading", { name: /frontière/i })).toBeVisible();
  await expect(page.getByTestId("stage-index")).toHaveText("01 / 10");
  await expect(page.getByTestId("player-score")).toHaveText("1");
  await expect(page.getByTestId("ai-score")).toHaveText("1");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(link).toBeVisible();
});

test("one territory claim triggers an AI reply; undo restores the opening", async ({ page }) => {
  await page.goto("/games/play/lisiere/");
  await expect(page.getByTestId("game-status")).toHaveText("À TOI DE JOUER");
  const move = page.getByTestId("cell-13");
  await expect(move).toBeEnabled();
  await move.click();
  await expect(page.getByTestId("game-status")).toHaveText("L'ENCRE RÉFLÉCHIT…");
  await expect(page.getByTestId("game-status")).toHaveText("À TOI DE JOUER");
  await expect(page.getByTestId("turn-count")).toHaveText("COUP 03");
  await expect(page.getByTestId("player-score")).toHaveText("2");
  await page.getByRole("button", { name: /Annuler le tour/ }).click();
  await expect(page.getByTestId("turn-count")).toHaveText("COUP 01");
  await expect(page.getByTestId("player-score")).toHaveText("1");
  await expect(move).toBeEnabled();
});

test("a user may undo while the AI is thinking and select available campaign regions", async ({ page }) => {
  await page.goto("/games/play/lisiere/");
  await expect(page.getByTestId("stage-select").locator('option[value="1"]')).toBeDisabled();
  const tile = page.getByTestId("cell-6");
  await tile.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("game-status")).toHaveText("L'ENCRE RÉFLÉCHIT…");
  await page.getByRole("button", { name: /Annuler le tour/ }).click();
  await expect(page.getByTestId("game-status")).toHaveText("À TOI DE JOUER");
  await expect(page.getByTestId("player-score")).toHaveText("1");
  await page.getByRole("button", { name: /Recommencer/ }).click();
  await expect(page.getByTestId("turn-count")).toHaveText("COUP 01");
});
