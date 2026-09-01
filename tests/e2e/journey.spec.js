import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("starts, reveals, explains and restores a journey", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: "Follow the evidence. Find the pattern.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Thor/ }).first().click();
  await expect(page).toHaveURL(/#discover/);
  await expect(
    page.getByRole("heading", { name: "Follow the thread" }),
  ).toBeVisible();
  await expect(page.locator(".journey-count strong")).toHaveText("1");
  await expect(page.locator(".journey-count")).toContainText(
    "figures uncovered",
  );

  await page.locator(".clue-button").first().click();
  await expect(page.locator(".journey-count strong")).toHaveText("2");
  await expect(page.locator(".new-thread.is-reveal")).toContainText(
    "New discovery",
  );
  await expect(page.locator(".context-identity h2")).not.toHaveText("Thor");

  await page.reload();
  await expect(page.locator(".journey-count strong")).toHaveText("2");
});

test("dossier exposes citations and returns focus on close", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Thor/ }).first().click();
  const dossierButton = page.getByRole("button", { name: "Open dossier" });
  await dossierButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Sources for this dossier")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(dossierButton).toBeFocused();
});

test("mobile navigation keeps every primary view reachable", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile"),
    "Mobile-only assertion",
  );
  const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole("link", { name: "Collection" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Browse the figures behind the threads.",
    }),
  ).toBeVisible();
  await expect(page.getByText("67 figures")).toBeVisible();
});
