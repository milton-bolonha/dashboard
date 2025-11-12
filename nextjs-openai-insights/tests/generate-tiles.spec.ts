import { test, expect } from "@playwright/test";

test.describe("Insights generation flow", () => {
  test("generates mock tiles and displays them in admin dashboard", async ({
    page,
  }) => {
    await page.goto("/");
    const fillField = async (name: string, value: string) => {
      const selector = `input[name="${name}"]`;
      await page.waitForSelector(`${selector}:not([disabled])`, {
        state: "visible",
      });
      await page.fill(selector, value);
    };

    await fillField("company", "Instituto Co");
    await fillField("companyWebsite", "https://example.com");
    await fillField("solution", "Mentorship Career Program");
    await fillField("researchTarget", "Upwork");
    await fillField("researchWebsite", "https://www.upwork.com");

    const submitButton = page.locator('button:has-text("Gerar insights agora")');
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });
    await submitButton.click();

    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.waitForSelector('[data-testid="tile-card"]', {
      timeout: 60_000,
    });

    const mockTiles = page.locator('[data-testid="tile-card"]');
    await expect(mockTiles.first()).toBeVisible({ timeout: 30_000 });
    await expect(mockTiles).toHaveCount(8);

    const storedSession = await page.evaluate(() =>
      window.localStorage.getItem("insights_workspace_last")
    );
    expect(storedSession).not.toBeNull();

    const storedWorkspace = await page.evaluate((sessionId) => {
      if (!sessionId) return null;
      return window.localStorage.getItem(`insights_workspace_${sessionId}`);
    }, storedSession);
    expect(storedWorkspace).not.toBeNull();
  });
});

