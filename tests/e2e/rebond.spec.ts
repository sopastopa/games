import { expect, test } from "@playwright/test";

test("REBOND is automatically listed and links back to the catalog", async ({ page }) => {
  await page.goto("/games/");
  const link = page.getByRole("link", { name: "Jouer à REBOND" });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/games\/play\/rebond\/$/);
  await expect(page.getByRole("heading", { name: /REBOND/ })).toBeVisible();
  await expect(page.getByTestId("level-index")).toHaveText("01 / 18");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
});

test("a reference shot reaches the target and unlocks the next stage", async ({ page }) => {
  await page.goto("/games/play/rebond/");
  await expect(page.getByTestId("phase")).toHaveText("PRÊT À LANCER");
  await page.getByLabel("Angle du lancer").fill("38");
  await page.getByLabel("Puissance du lancer").fill("570");
  await page.getByTestId("shoot").click();
  await expect(page.getByTestId("phase")).toHaveText("CIBLE ATTEINTE", { timeout: 10000 });
  await expect(page.getByTestId("completion")).toBeVisible();
  await expect(page.getByTestId("attempts")).toHaveText("01");
  await page.reload();
  await expect(page.getByTestId("level-select").locator('option[value="1"]')).toBeEnabled();
  await page.getByTestId("level-select").selectOption("1");
  await expect(page.getByTestId("level-index")).toHaveText("02 / 18");
});

test("the player can drag to launch, prepare again and use the keyboard", async ({ page }) => {
  await page.goto("/games/play/rebond/");
  const board = page.getByTestId("board");
  const box = await board.boundingBox();
  if (!box) throw new Error("Board is not visible");
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.40);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.39, box.y + box.height * 0.59, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("phase")).toHaveText("EN VOL");
  await page.getByRole("button", { name: /Nouveau tir/ }).click();
  await expect(page.getByTestId("phase")).toHaveText("PRÊT À LANCER");
  await board.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("attempts")).toHaveText("02");
  await page.getByRole("button", { name: /Recommencer/ }).click();
  await expect(page.getByTestId("attempts")).toHaveText("00");
});
