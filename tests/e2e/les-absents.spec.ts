import { expect, test } from "@playwright/test";

test("Les Absents appears in the portal and can be opened and left", async ({
  page,
}) => {
  await page.goto("/games/");
  const game = page.getByRole("link", { name: "Jouer à Les Absents" });
  await expect(game).toBeVisible();
  await game.click();
  await expect(page).toHaveURL(/\/games\/play\/les-absents\/$/);
  await expect(
    page.getByRole("heading", { name: /Les Absents/ }),
  ).toBeVisible();
  await expect(page.getByTestId("level-index")).toHaveText("01 / 24");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(game).toBeVisible();
});

test("a real puzzle is solved, progress unlocks and survives reload", async ({
  page,
}) => {
  await page.goto("/games/play/les-absents/");
  await expect(page.getByTestId("completion")).toBeHidden();
  await expect(page.getByTestId("budget")).toHaveText("1 retrait disponible");
  await page.getByRole("button", { name: /Indice/ }).click();
  const suggested = page.getByTestId("hint-node");
  await expect(suggested).toBeVisible();
  await suggested.click();
  await expect(page.getByTestId("completion")).toBeVisible();
  await expect(page.getByTestId("status")).toHaveText("ÉQUILIBRE");
  await expect(page.getByTestId("receivers")).toHaveText("2 / 2");
  await expect(page.getByTestId("danger")).toHaveText("ISOLÉE");
  await page.reload();
  await expect(page.getByTestId("completion")).toBeHidden();
  const levels = page.getByTestId("level-select");
  await expect(levels.locator('option[value="1"]')).toBeEnabled();
  await levels.selectOption("1");
  await expect(page.getByTestId("level-index")).toHaveText("02 / 24");
  await expect(page.getByTestId("completion")).toBeHidden();
});

test("undo and redo alter the board without requiring a mouse", async ({
  page,
}) => {
  await page.goto("/games/play/les-absents/");
  const neutral = page.getByRole("button", { name: /Nœud 1 — retirer/ });
  await neutral.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("budget")).toHaveText("0 retraits disponibles");
  await page.getByRole("button", { name: /Annuler/ }).click();
  await expect(page.getByTestId("budget")).toHaveText("1 retrait disponible");
  await page.getByRole("button", { name: /Rétablir/ }).click();
  await expect(page.getByTestId("budget")).toHaveText("0 retraits disponibles");
  await page.getByRole("button", { name: /Recommencer/ }).click();
  await expect(page.getByTestId("budget")).toHaveText("1 retrait disponible");
});
