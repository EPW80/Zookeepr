import { expect, flash, pick, test, unique } from "./fixtures.js";

test.describe("adding animals", () => {
  test("adds an animal, clears the form, and finds it by its traits", async ({
    page,
  }) => {
    const name = unique("Darlene");
    await page.goto("/");

    await page.getByLabel("Animal Name").fill(name);
    await page.getByLabel("Species").fill("otter");
    await pick(page, "piscivore-input");
    await pick(page, "trait-zany");
    await pick(page, "trait-goofy");
    await page.locator("#animal-form button").click();

    await expect(flash(page)).toHaveText(`Thank you for adding ${name}!`);
    await expect(page.getByLabel("Animal Name")).toHaveValue("");
    await expect(page.locator("#trait-zany")).not.toBeChecked();

    await page.goto("/animals");
    await pick(page, "filter-trait-zany");
    await pick(page, "filter-trait-goofy");
    await page.locator("#animals-form button").click();
    const card = page.locator(".card", { hasText: name });
    await expect(card).toContainText("Personality Traits: Zany, Goofy");
  });

  test("shows a validation error for a missing species", async ({
    page,
    allowStatus,
  }) => {
    allowStatus(400);
    await page.goto("/");

    await page.getByLabel("Animal Name").fill(unique("NoSpecies"));
    await page.locator("#animal-form button").click();

    await expect(flash(page)).toHaveText("Error: species is required");
    await expect(flash(page)).toHaveClass(/flash-error/);
  });

  test("renders a script-like name as plain text", async ({
    page,
    request,
  }) => {
    const payload = `<img src=x onerror="window.__pwned=1"> ${unique("x")}`;
    await request.post("/api/animals", {
      data: {
        name: payload,
        species: "otter",
        diet: "piscivore",
        personalityTraits: [],
      },
    });

    await page.goto("/animals");
    await expect(page.locator(".card h4", { hasText: payload })).toHaveText(
      payload,
    );
    expect(await page.evaluate(() => "__pwned" in globalThis)).toBe(false);
  });
});

test.describe("filtering animals", () => {
  test("filters by diet and clears the filter with Any", async ({ page }) => {
    await page.goto("/animals");
    const cards = page.locator("#display-area .card");
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();

    await pick(page, "carnivore-input");
    await page.locator("#animals-form button").click();
    await expect(cards.first()).toContainText("Diet: Carnivore");
    for (const text of await cards.allTextContents()) {
      expect(text).toContain("Diet: Carnivore");
    }
    expect(await cards.count()).toBeLessThan(total);

    await pick(page, "any-diet-input");
    await page.locator("#animals-form button").click();
    await expect(cards).toHaveCount(total);
  });

  test("says so when nothing matches", async ({ page }) => {
    await page.goto("/animals");
    await pick(page, "filter-trait-anxious");
    await pick(page, "filter-trait-loving");
    await pick(page, "filter-trait-goofy");
    await page.locator("#animals-form button").click();

    await expect(flash(page)).toHaveText("No animals match that search.");
    await expect(page.locator("#display-area .card")).toHaveCount(0);
  });
});

test.describe("zookeepers", () => {
  test("rejects a blank age", async ({ page, allowStatus }) => {
    allowStatus(400);
    await page.goto("/");

    await page.getByLabel("Zookeeper Name").fill(unique("Kim"));
    await page.getByLabel("Favorite Animal").fill("otter");
    await page.locator("#zookeeper-form button").click();

    await expect(flash(page)).toHaveText("Error: age must be a number");
  });

  test("saves age 0 and finds a name containing &", async ({ page }) => {
    const name = unique("Baby & Co");
    await page.goto("/");

    await page.getByLabel("Zookeeper Name").fill(name);
    await page.getByLabel("Age").fill("0");
    await page.getByLabel("Favorite Animal").fill("otter");
    await page.locator("#zookeeper-form button").click();
    await expect(flash(page)).toHaveText(`Thank you for adding ${name}!`);

    await page.goto("/zookeepers");
    await page.getByLabel("Search by name").fill(name);
    await page.locator("#zookeeper-form button").click();
    const cards = page.locator("#display-area .card");
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText(`${name}Age: 0Favorite Animal: Otter`);
  });
});

test.describe("pages", () => {
  test("loads styles and the header image on every page", async ({ page }) => {
    for (const path of ["/", "/animals", "/zookeepers"]) {
      await page.goto(path);
      await expect(page.locator("header")).toHaveCSS(
        "background-image",
        /header-bg\.jpg/,
      );
    }
  });

  test("draws trait checkboxes square and diet radios round", async ({
    page,
  }) => {
    await page.goto("/");
    const radius = (inputId: string) =>
      page
        .locator(`label[for="${inputId}"]`)
        .evaluate((label) => getComputedStyle(label, "::before").borderRadius);

    expect(await radius("trait-hungry")).toBe("3px");
    expect(await radius("herbivore-input")).toBe("100%");
    await pick(page, "trait-hungry");
    expect(await radius("trait-hungry")).toBe("3px");
  });

  test("falls back to a working home page for unknown pages", async ({
    page,
  }) => {
    // Nested on purpose: asset paths must not resolve relative to the URL
    await page.goto("/some/unknown/page");
    await expect(page.locator("#animal-form")).toBeVisible();
    await expect(page.locator("header")).toHaveCSS(
      "background-image",
      /header-bg\.jpg/,
    );
  });
});
