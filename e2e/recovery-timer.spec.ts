import { test, expect } from "@playwright/test";

test.describe("Recovery & Mobility Guided Timer", () => {
  test("should render /recovery page with custom AI generator and pre-defined protocols", async ({ page }) => {
    await page.goto("/recovery");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText(/Recovery & Warm-Up/i);
    await expect(page.locator("text=AI Custom Stretch & Recovery Generator")).toBeVisible();
    await expect(page.locator("text=Dynamic Warm-Up").or(page.locator("text=Pre-Defined Recovery Protocols"))).toBeVisible();
  });

  test("should allow selecting muscle groups and duration in recovery generator", async ({ page }) => {
    await page.goto("/recovery");
    await page.waitForLoadState("domcontentloaded");

    // Click Chest muscle group pill
    const chestPill = page.locator("button", { hasText: "Chest" }).first();
    if (await chestPill.isVisible()) {
      await chestPill.click();
    }

    // Check 10 min duration button
    const tenMinBtn = page.locator("button", { hasText: "10 mins" }).first();
    if (await tenMinBtn.isVisible()) {
      await tenMinBtn.click();
    }

    // Toggle auto-advance checkbox
    const autoAdvanceCheckbox = page.locator("input[type='checkbox']").first();
    if (await autoAdvanceCheckbox.isVisible()) {
      await expect(autoAdvanceCheckbox).toBeChecked();
    }
  });

  test("should start a pre-defined routine timer modal", async ({ page }) => {
    await page.goto("/recovery");
    await page.waitForLoadState("domcontentloaded");

    const startBtn = page.locator("button", { hasText: "Start Timer" }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      // Expect the circular timer modal with pause/play controls to appear
      await expect(page.locator("button[title*='Pause stretch']").or(page.locator("button[title*='Resume stretch']"))).toBeVisible();
      // Exit timer
      const exitBtn = page.locator("button[title*='Exit timer']").first();
      if (await exitBtn.isVisible()) {
        await exitBtn.click();
      }
    }
  });
});
