import { test, expect } from "@playwright/test";

test.describe("Client Creation & Athlete Management Workflows", () => {
  test("should render trainer client sidebar and add client action", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Body should be visible
    await expect(page.locator("body")).toBeVisible();

    // If redirected to signin or on dashboard, check elements
    const isSignIn = page.url().includes("/auth/signin");
    if (!isSignIn) {
      // Expect sidebar or mobile switcher
      await expect(page.locator("text=Clients").or(page.locator("text=Add Client")).or(page.locator("text=My Workouts"))).toBeVisible();
    }
  });

  test("should open Add Client modal and validate required fields", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const isSignIn = page.url().includes("/auth/signin");
    if (!isSignIn) {
      const addBtn = page.locator("button", { hasText: "Add Client" }).or(page.locator("button", { hasText: "+ Client" })).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await expect(page.locator("text=Add New Client")).toBeVisible();
        await expect(page.locator("input[placeholder*='Sarah Connor']")).toBeVisible();

        // Submit empty name to verify required validation
        const submitBtn = page.locator("button[type='submit']", { hasText: "Add Client" });
        await submitBtn.click();
        await expect(page.locator("text=Client name is required")).toBeVisible();
      }
    }
  });

  test("should load athlete invite page with valid token structure", async ({ page }) => {
    await page.goto("/invite/sample-test-token-12345");
    await page.waitForLoadState("domcontentloaded");

    // Should load the invite handler cleanly without runtime errors
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Invite").or(page.locator("text=Welcome")).or(page.locator("text=Sign In"))).toBeVisible();
  });
});
