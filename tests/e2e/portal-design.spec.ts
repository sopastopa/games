import { expect, test, type Page } from "@playwright/test";

async function catalog(
  page: Page,
): Promise<{ id: string; category: string }[]> {
  const response = await page.request.get("/games/catalog.json");
  expect(response.ok()).toBe(true);
  return (await response.json()) as { id: string; category: string }[];
}

test("the collection exposes every published game with a consistent, clear navigation", async ({
  page,
}) => {
  await page.goto("/games/");
  await expect(page).toHaveTitle(/Games/);
  await expect(page.getByRole("heading", { name: /Jouer,/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /La collection/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Games, accueil" }),
  ).toBeVisible();

  const games = await catalog(page);
  const links = page.locator("#game-list > a");
  await expect(links).toHaveCount(games.length);
  await expect(page.getByRole("link", { name: "Jouer à NUAGE" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jouer à Snake" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jouer à TORSION" }),
  ).toBeVisible();
  await expect(page.locator("#hero-count")).toHaveText(
    String(games.length).padStart(2, "0"),
  );
  await expect(page.getByRole("button", { name: "Tous" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("category selection filters available games without losing accessible links", async ({
  page,
}) => {
  await page.goto("/games/");
  const adventure = page.getByRole("button", { name: "Aventure", exact: true });
  const games = await catalog(page);
  const adventureCount = games.filter(
    (game) => game.category === "Aventure",
  ).length;
  await adventure.click();
  await expect(adventure).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#game-list > a")).toHaveCount(adventureCount);
  await expect(page.getByRole("link", { name: "Jouer à NUAGE" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jouer à VEILLE" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Jouer à Snake" })).toHaveCount(
    0,
  );
  await expect(page.locator("#count")).toContainText(
    `${adventureCount} jeu${adventureCount > 1 ? "x" : ""} sur ${games.length}`,
  );
  await page.getByRole("button", { name: "Tous" }).click();
  await expect(page.locator("#game-list > a")).toHaveCount(games.length);
  await expect(page.getByRole("button", { name: "Tous" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("case- and accent-insensitive search, no results and reset", async ({
  page,
}) => {
  await page.goto("/games/");
  const search = page.getByTestId("game-search");
  await search.fill("absents");
  await expect(page.locator("#game-list > a")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Jouer à Les Absents" }),
  ).toBeVisible();
  await search.fill("REFLEXION");
  await expect(page.locator("#game-list > a")).toHaveCount(2);
  await search.fill("aucun-jeu-ne-porte-ce-nom");
  await expect(page.locator("#game-list > a")).toHaveCount(0);
  await expect(page.getByText("Aucun jeu trouvé.")).toBeVisible();
  await page.getByRole("button", { name: "Voir toute la collection" }).click();
  await expect(page.locator("#game-list > a")).toHaveCount(
    (await catalog(page)).length,
  );
  await expect(search).toHaveValue("");
});

test("keyboard navigation opens a game and keeps the shared way back", async ({
  page,
}) => {
  await page.goto("/games/");
  const snake = page.getByRole("link", { name: "Jouer à Snake" });
  await snake.focus();
  await expect(snake).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/games\/play\/snake\/$/);
  const back = page.getByTestId("back-home");
  await expect(back).toBeVisible();
  await expect(back).toHaveCSS("border-top-left-radius", "999px");
  await back.click();
  await expect(page).toHaveURL(/\/games\/$/);
});

test("small screens retain readable cards, search and navigation without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/games/");
  await expect(page.getByRole("heading", { name: /Jouer,/ })).toBeVisible();
  await expect(page.getByTestId("game-search")).toBeVisible();
  await expect(page.getByRole("link", { name: "Jouer à NUAGE" })).toBeVisible();
  await expect(page.locator("#game-list > a")).toHaveCount(
    (await catalog(page)).length,
  );
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport + 1);
});
