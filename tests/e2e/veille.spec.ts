import { expect, test } from "@playwright/test";
import { shortestPath } from "../../games/veille/src/domain/generation";
import { directionBetween, newExpedition } from "../../games/veille/src/domain/rules";
import { EXIT } from "../../games/veille/src/domain/types";

test("catalogue → deployment → movement → reload → portal", async ({ page }) => {
  await page.goto("/games/");
  await page.getByRole("link", { name: "Jouer à VEILLE" }).click();
  await expect(page).toHaveURL(/\/games\/play\/veille\/$/);
  await page.getByTestId("launch").click();
  await expect(page.getByTestId("game-status")).toContainText("Explore les alentours");
  const first = await page.getByTestId("turn").textContent();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("turn")).not.toHaveText(first!);
  await page.reload();
  await expect(page.getByTestId("turn")).not.toHaveText("00");
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
});

test("a genuine expedition can reach victory and unlock the next sector", async ({ page }) => {
  const seed = 17;
  let run = newExpedition(0, seed, "guardian");
  const targets = run.terrain.flatMap((kind, index) => kind === "core" ? [index] : []);
  targets.push(EXIT);
  await page.goto("/games/play/veille/");
  await page.getByRole("combobox", { name: "Spécialité" }).selectOption("guardian");
  await page.getByRole("spinbutton", { name: /Graine facultative/ }).fill(String(seed));
  await page.getByTestId("launch").click();
  for (const target of targets) {
    const path = shortestPath(run.terrain, run.position, target);
    for (const position of path.slice(1)) {
      await page.getByTestId(`tile-${position}`).click();
      run = { ...run, position };
    }
  }
  await expect(page.getByTestId("outcome")).toBeVisible();
  await expect(page.getByTestId("outcome")).toContainText("Signal rétabli");
  await page.getByRole("button", { name: /Secteur suivant/ }).click();
  await expect(page.getByText("La galerie des cartes", { exact: true })).toBeVisible();
});

test("fullscreen, tool controls and mobile viewport remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/play/veille/");
  const full = page.getByTestId("fullscreen-toggle");
  await full.click();
  await expect(full).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("launch").click();
  await expect(page.getByTestId("board")).toBeVisible();
  await page.getByRole("button", { name: /Scanner/ }).click();
  await expect(page.getByTestId("energy")).toHaveText("4 / 7");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await full.click();
  await expect(full).toHaveAttribute("aria-pressed", "false");
});
