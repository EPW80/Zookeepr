import { test as base, expect, type Page } from "@playwright/test";

/**
 * Every test fails if the page throws, logs a console error, or gets a 4xx
 * or 5xx response, unless the test allows that status first.
 */
export const test = base.extend<{ allowStatus: (status: number) => void }>({
  allowStatus: [
    async ({ page }, use) => {
      const allowed = new Set<number>();
      const problems: string[] = [];

      page.on("pageerror", (err) =>
        problems.push(`page error: ${err.message}`),
      );
      page.on("console", (msg) => {
        // Failed requests are checked below, by status
        if (
          msg.type() === "error" &&
          !msg.text().startsWith("Failed to load")
        ) {
          problems.push(`console error: ${msg.text()}`);
        }
      });
      page.on("response", (res) => {
        if (res.status() >= 400 && !allowed.has(res.status())) {
          problems.push(`${res.status()} ${res.url()}`);
        }
      });

      await use((status) => allowed.add(status));
      expect(problems).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** A name no other test uses, since all tests share one database. */
export const unique = (label: string) =>
  `${label} ${Math.random().toString(36).slice(2, 8)}`;

/**
 * Tick a radio or checkbox. The real inputs are hidden off-screen behind
 * custom-drawn ones, so click the label like a user would.
 */
export async function pick(page: Page, inputId: string) {
  await page.locator(`label[for="${inputId}"]`).click();
  await expect(page.locator(`#${inputId}`)).toBeChecked();
}

export const flash = (page: Page) => page.locator("#flash");
