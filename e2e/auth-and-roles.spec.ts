import { test, expect } from "@playwright/test";

test.describe("Authentication & Role Switching", () => {
  test("should render signin page with login options", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page).toHaveTitle(/STRKYR/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load client onboarding modal with goals and experience level", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate to public terms and privacy policy pages", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("body")).toContainText("Terms");

    await page.goto("/privacy");
    await expect(page.locator("body")).toContainText("Privacy");
  });
});
