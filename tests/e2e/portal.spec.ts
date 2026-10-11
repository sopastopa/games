import { expect, test } from "@playwright/test";

test("portal displays the Snake game and opens it", async ({ page }) => {
  await page.goto("/games/");
  await expect(page).toHaveTitle(/Games/);
  const snake = page.getByRole("link", { name: "Jouer à Snake" });
  await expect(snake).toBeVisible();
  await snake.click();
  await expect(page).toHaveURL(/\/games\/play\/snake\/$/);
  await expect(page.getByRole("heading", { name: /Snake/ })).toBeVisible();
});

test("player can start, move, lose, restart and return to catalog", async ({
  page,
}) => {
  await page.goto("/games/play/snake/");
  const status = page.getByTestId("game-status");
  await expect(status).toHaveText("Prêt à jouer");
  await page.getByRole("button", { name: "Démarrer" }).click();
  await expect(status).toHaveText("En cours");
  await page.keyboard.press("ArrowUp");
  await expect(status).toHaveText("Partie terminée", { timeout: 6000 });
  await page.getByRole("button", { name: "Recommencer" }).click();
  await expect(status).toHaveText("Prêt à jouer");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(page.getByRole("link", { name: "Jouer à Snake" })).toBeVisible();
});
