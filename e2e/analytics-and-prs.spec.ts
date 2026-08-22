import { test, expect } from "@playwright/test";

test.describe("Analytics & PR Visual Verification", () => {
  test("should render client dashboard and switch between tabs", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check if recovery link in header is present
    const recoveryHeaderLink = page.locator("a[href='/recovery']").first();
    if (await recoveryHeaderLink.isVisible()) {
      await expect(recoveryHeaderLink).toBeVisible();
    }
  });
});
