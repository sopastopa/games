import { expect, test } from "@playwright/test";
import { generateArena, SIZE, START, visibleCells } from "../../games/prisme/src/domain/map";
import { cameraFor } from "../../games/prisme/src/presentation/renderer";

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
    await expect(page.getByTestId("game-status")).toContainText(
      /BADGES|RELAIS|PORTE|BONUS/,
    );
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

test("strategic planning freezes the battlefield and accepts explored waypoints", async ({
  page,
}) => {
  await page.goto("/games/play/prisme/");
  await page.getByTestId("primary").click();
  await page.keyboard.press("KeyM");
  await expect(page.getByTestId("planning")).toBeVisible();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await expect(page.getByTestId("plan-map")).toBeVisible();
  const chart = page.getByTestId("plan-map");
  const box = await chart.boundingBox();
  expect(box).not.toBeNull();
  // Starting district lies near the northwest of the world.
  const s = Math.min(box!.width, box!.height) / 41;
  const ox = (box!.width - 41 * s) / 2;
  const oy = (box!.height - 41 * s) / 2;
  await page.mouse.click(box!.x + ox + s * 7.5, box!.y + oy + s * 5.5);
  await page.getByTestId("close-plan").click();
  await expect(page.getByTestId("planning")).toBeHidden();
  await expect(page.getByTestId("game-status")).toBeVisible();
});

test("reconnaissance spends one radar charge; desktop doors remain accessible", async ({
  page,
}) => {
  await page.goto("/games/play/prisme/");
  await page.getByTestId("primary").click();
  await expect(page.locator("#scan-charges")).toHaveText("RADAR : 2");
  await page.getByTestId("scan").click();
  await expect(page.locator("#scan-charges")).toHaveText("RADAR : 1");
  await expect(page.getByTestId("game-status")).toContainText("RECONNAISSANCE");
  await expect(page.getByTestId("interact")).toBeVisible();
  await page.keyboard.press("KeyP");
  await expect(page.getByTestId("overlay")).toBeVisible();
});

test("twin stick input is playable on portrait and landscape screens", async ({
  page,
}) => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/games/play/prisme/");
    await page.getByTestId("primary").click();
    const move = page.getByTestId("move-stick");
    const rect = await move.boundingBox();
    expect(rect).not.toBeNull();
    const x = rect!.x + rect!.width / 2;
    const y = rect!.y + rect!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 38, y, { steps: 5 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    const fire = page.getByTestId("fire");
    const fireBounds = await fire.boundingBox();
    expect(fireBounds).not.toBeNull();
    await page.mouse.move(
      fireBounds!.x + fireBounds!.width / 2,
      fireBounds!.y + fireBounds!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      fireBounds!.x + fireBounds!.width / 2 + 24,
      fireBounds!.y + fireBounds!.height / 2,
      { steps: 5 },
    );
    await page.waitForTimeout(160);
    await page.mouse.up();
    const right = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(right).toBe(true);
    await expect(page.getByTestId("board")).toBeVisible();
  }
});

test("PRISME paints visible wall blocks with contrast against the floor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const seed = 48271;
  const arena = generateArena(seed, 1);
  const visible = visibleCells(arena, START);
  const wall = arena.walls
    .map((isWall, index) => ({ isWall, x: index % SIZE, y: Math.floor(index / SIZE), index }))
    .filter(({ isWall, x, y, index }) =>
      isWall && visible[index] && Math.hypot(x - START.x, y - START.y) < 6)
    .sort((a, b) =>
      Math.hypot(a.x - START.x, a.y - START.y) -
      Math.hypot(b.x - START.x, b.y - START.y))[0];
  expect(wall).toBeDefined();

  await page.goto("/games/play/prisme/");
  await page.getByTestId("seed-input").fill(String(seed));
  await page.getByTestId("primary").click();
  await expect(page.getByTestId("overlay")).toBeHidden();
  await page.waitForTimeout(160);

  const board = page.getByTestId("board");
  const dimensions = await board.evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  }));
  const camera = cameraFor(dimensions.width, dimensions.height, START);
  const samples = await board.evaluate((canvas: HTMLCanvasElement, data) => {
    const ctx = canvas.getContext("2d")!;
    const ratio = canvas.width / canvas.clientWidth;
    const sample = (x: number, y: number) => {
      const px = Math.round((x - data.camera.x + 0.5) * data.camera.scale * ratio);
      const py = Math.round((y - data.camera.y + 0.5) * data.camera.scale * ratio);
      return Array.from(ctx.getImageData(px, py, 1, 1).data).slice(0, 3);
    };
    return {
      wall: sample(data.wall.x, data.wall.y),
      floor: sample(5, 7),
    };
  }, { camera, wall: { x: wall!.x, y: wall!.y } });
  expect(samples.wall[0]!).toBeGreaterThan(samples.floor[0]! + 35);
  expect(samples.wall[1]!).toBeGreaterThan(samples.floor[1]! + 35);
});
