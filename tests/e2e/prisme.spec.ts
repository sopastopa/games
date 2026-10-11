import { expect, test } from "@playwright/test";

test("catalogue → seeded assault → pause → resume → portal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/games/");
  await page.getByRole("link", { name: "Jouer à PRISME" }).click();
  await expect(page).toHaveURL(/\/games\/play\/prisme\/$/);
  await expect(page.getByTestId("overlay")).toBeVisible();
  await page.getByTestId("seed-input").fill("17713");
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await expect(page.getByTestId("seed-label")).toContainText("17713");
  const before = await page
    .locator("#board")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(220);
  await page.keyboard.up("ArrowRight");
  const after = await page
    .locator("#board")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  expect(after).not.toBe(before);
  await page.getByTestId("pause-toggle").click();
  await expect(page.getByTestId("overlay")).toBeVisible();
  await expect(page.getByTestId("primary")).toHaveText("REPRENDRE →");
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await page.getByTestId("back-home").click();
  await expect(page).toHaveURL(/\/games\/$/);
  expect(errors).toEqual([]);
});

test("desktop fullscreen retains the entire playable arena and exits with Escape", async ({
  page,
}) => {
  await page.goto("/games/play/prisme/");
  const full = page.getByTestId("fullscreen-toggle");
  await full.click();
  await expect(full).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("board")).toBeVisible();
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(full).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("board")).toBeVisible();
});

test("mobile portrait and landscape preserve shooting, movement and fullscreen", async ({
  page,
}) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/games/play/prisme/");
    await page.getByTestId("fullscreen-toggle").click();
    await expect(page.getByTestId("fullscreen-toggle")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByTestId("primary").click();
    await expect(page.getByTestId("overlay")).toBeHidden();
    const bounds = await page.getByTestId("board").boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(120);
    expect(bounds!.width).toBeLessThanOrEqual(size.width);
    const fire = page.getByTestId("fire");
    await expect(fire).toBeVisible();
    const box = await fire.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.getByTestId("dash").click();
    await expect(page.getByTestId("game-status")).toContainText("RELAIS");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
    await page.getByTestId("fullscreen-toggle").click();
    await expect(page.getByTestId("fullscreen-toggle")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  }
});

test("invalid seeds are rejected and a saved seed is restored after navigation", async ({
  page,
}) => {
  await page.goto("/games/play/prisme/");
  await page.getByTestId("seed-input").fill("0");
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeVisible();
  await page.getByTestId("seed-input").fill("80731");
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await page.reload();
  await expect(page.getByTestId("seed-input")).toHaveValue("80731");
});
