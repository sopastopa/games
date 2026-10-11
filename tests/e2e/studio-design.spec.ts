import { expect, test } from "@playwright/test";

test("the collection keeps search, categories and all existing game links", async ({
  page,
}) => {
  await page.goto("/games/");
  await expect(page.getByRole("heading", { name: /Jouer, tout simplement/ })).toBeVisible();
  await expect(page.getByText("7 jeux à découvrir")).toBeVisible();
  await expect(page.locator(".game-card")).toHaveCount(7);

  await page.getByRole("button", { name: "Adresse" }).click();
  await expect(page.getByRole("button", { name: "Adresse" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("link", { name: "Jouer à PULSE" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jouer à REBOND" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jouer à NUAGE" })).toHaveCount(0);

  await page.getByRole("button", { name: "Tous" }).click();
  await page.getByTestId("game-search").fill("torsion");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page.getByTestId("game-search").fill("");
  await expect(page.locator(".game-card")).toHaveCount(7);
});

test("the light catalogue stays responsive with no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto("/games/");
  await expect(page.getByRole("link", { name: "Jouer à NUAGE" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
});

test("all seven games share the light studio frame, keyboard skip and collection links", async ({
  page,
}) => {
  const slugs = ["snake", "les-absents", "pulse", "rebond", "lisiere", "torsion", "nuage"];
  for (const slug of slugs) {
    await page.goto("/games/play/" + slug + "/");
    await expect(page.getByTestId("back-home")).toBeVisible();
    await expect(page.locator(".studio-lockup")).toBeVisible();
    await expect(page.locator("#studio-main")).toBeVisible();
    await expect(page.getByTestId("studio-next")).toHaveAttribute("href", /\.\.\//);
    await expect(page.locator("link[href='../../studio.css']")).toHaveCount(1);
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(247, 248, 245)");
    await page.getByTestId("back-home").click();
    await expect(page).toHaveURL(/\/games\/$/);
  }
});

test("mobile gameplay retains its input and offers an accessible route to the next game", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/games/play/nuage/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".studio-skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-main")).toBeVisible();
  await expect(page.getByTestId("jump")).toBeVisible();
  await expect(page.getByTestId("studio-next")).toHaveAttribute("href", "../snake/");
  await page.getByTestId("studio-next").click();
  await expect(page).toHaveURL(/\/games\/play\/snake\/$/);
  await expect(page.getByRole("heading", { name: /Snake/ })).toBeVisible();
});
