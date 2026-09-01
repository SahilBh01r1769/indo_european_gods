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
  await expect(dialog.getByText("Sources and further reading")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(dossierButton).toBeFocused();
});

test("guided stories reveal their route automatically without mystery nodes", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Stories" }).first().click();
  await page.getByRole("button", { name: "Begin journey" }).first().click();

  await expect(page).toHaveURL(/#discover/);
  await expect(page.locator(".graph-node-clue")).toHaveCount(0);
  await expect(page.locator(".journey-count strong")).toHaveText("4", {
    timeout: 12_000,
  });
  await expect(page.locator(".story-complete")).toBeVisible();
  await expect(page.locator(".graph-node-clue")).toHaveCount(0);

  const overlappingPairs = await page
    .locator(".graph-node-deity")
    .evaluateAll((elements) => {
      const boxes = elements.map((element) => ({
        name: element.getAttribute("aria-label"),
        box: element.getBoundingClientRect(),
      }));
      return boxes.flatMap((left, index) =>
        boxes.slice(index + 1).flatMap((right) => {
          const separated =
            left.box.right < right.box.left ||
            right.box.right < left.box.left ||
            left.box.bottom < right.box.top ||
            right.box.bottom < left.box.top;
          return separated ? [] : [[left.name, right.name]];
        }),
      );
    });
  expect(overlappingPairs).toEqual([]);
});

test("native-language names occupy deity nodes", async ({ page }) => {
  await page.getByRole("button", { name: /Thor/ }).first().click();
  await expect(
    page.locator(".graph-node-deity .node-glyph").first(),
  ).toHaveText("Þórr");
});

test("geography renders a visible fixed map and methodology is legible", async ({
  page,
}, testInfo) => {
  await page.getByRole("button", { name: /Thor/ }).first().click();
  await page.getByRole("button", { name: "Geography" }).click();
  await expect(page.locator(".geo-land")).toHaveCount(3);

  const node = page.locator(".graph-node-deity").first();
  const before = await node.getAttribute("transform");
  const box = await node.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2);
    await page.mouse.up();
  }
  await expect(node).toHaveAttribute("transform", before);

  if (!testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: "Methodology" }).click();
    const bodySize = await page
      .locator(".about-overlay .evidence-grid article p")
      .first()
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      );
    expect(bodySize).toBeGreaterThanOrEqual(15);
  }
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
