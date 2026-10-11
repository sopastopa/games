import { expect, test } from "@playwright/test";

test("PULSE is automatically listed and returns to the catalog", async ({
  page,
}) => {
  await page.goto("/games/");
  const game = page.getByRole("link", { name: "Jouer à PULSE" });
  await expect(game).toBeVisible();
  await game.click();
  await expect(page).toHaveURL(/\/games\/play\/pulse\/$/);
  await expect(page.getByRole("heading", { name: /PULSE/ })).toBeVisible();
  await expect(page.getByTestId("status")).toHaveText("PRÊT");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
  await expect(game).toBeVisible();
});

test("one-tap gameplay, pause, immediate failure and quick retry", async ({
  page,
}) => {
  await page.goto("/games/play/pulse/");
  const action = page.getByTestId("action");
  const status = page.getByTestId("status");
  await expect(action).toContainText("COMMENCER");
  await action.click();
  await expect(status).toHaveText("EN JEU");
  await page.getByRole("button", { name: /Pause/ }).click();
  await expect(status).toHaveText("EN PAUSE");
  await action.click();
  await expect(status).toHaveText("EN JEU");
  await action.click();
  await expect(status).toHaveText("TERMINÉ");
  await expect(page.getByTestId("score")).toHaveText("0");
  await expect(action).toContainText("REJOUER");
  await action.click();
  await expect(status).toHaveText("EN JEU");
  await page.getByRole("button", { name: /Recommencer/ }).click();
  await expect(status).toHaveText("PRÊT");
});

test("sound requires opt-in and a keyboard shortcut starts play", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/games/play/pulse/");
  const sound = page.getByRole("button", { name: /Son : non/ });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(page.getByRole("button", { name: /Son : oui/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByTestId("dial").focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("status")).toHaveText("EN JEU");
  await page.keyboard.press("p");
  await expect(page.getByTestId("status")).toHaveText("EN PAUSE");
});
