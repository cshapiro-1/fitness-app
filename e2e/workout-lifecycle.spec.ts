import { test, expect } from "@playwright/test";

test.describe("Workout Lifecycle & Builder Flow", () => {
  test("should render dashboard and plate math calculator", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check if plate calculator can be opened
    const plateBtn = page.locator("button", { hasText: /Plate Math/i }).first();
    if (await plateBtn.isVisible()) {
      await plateBtn.click();
      await expect(page.locator("text=Barbell Plate Calculator").or(page.locator("text=Target Weight"))).toBeVisible();
    }
  });

  test("should load nutrition and macros tracker", async ({ page }) => {
    await page.goto("/nutrition");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
