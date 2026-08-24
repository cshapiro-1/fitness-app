import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Google Play Store Configuration & Listing Metadata Tests", () => {
  const metadataDir = path.resolve(process.cwd(), "playstore", "metadata");

  it("should have valid Google Play title within 30 character limit", () => {
    const titlePath = path.join(metadataDir, "title.txt");
    expect(fs.existsSync(titlePath)).toBe(true);
    const title = fs.readFileSync(titlePath, "utf-8").trim();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain("STRKYR");
  });

  it("should have valid Google Play short description within 80 character limit", () => {
    const shortDescPath = path.join(metadataDir, "short_description.txt");
    expect(fs.existsSync(shortDescPath)).toBe(true);
    const shortDesc = fs.readFileSync(shortDescPath, "utf-8").trim();
    expect(shortDesc.length).toBeGreaterThan(0);
    expect(shortDesc.length).toBeLessThanOrEqual(80);
  });

  it("should have detailed Google Play full description covering core features and privacy policy", () => {
    const fullDescPath = path.join(metadataDir, "full_description.txt");
    expect(fs.existsSync(fullDescPath)).toBe(true);
    const fullDesc = fs.readFileSync(fullDescPath, "utf-8").trim();
    expect(fullDesc).toContain("STRKYR");
    expect(fullDesc).toContain("Coach-Governed AI");
    expect(fullDesc).toContain("https://strkyr.fit/privacy");
  });

  it("should have valid app_details.json with package name com.strkyr.app", () => {
    const appDetailsPath = path.join(metadataDir, "app_details.json");
    expect(fs.existsSync(appDetailsPath)).toBe(true);
    const appDetails = JSON.parse(fs.readFileSync(appDetailsPath, "utf-8"));
    expect(appDetails.packageName).toBe("com.strkyr.app");
    expect(appDetails.versionCode).toBe(100);
    expect(appDetails.versionName).toBe("1.0.0");
    expect(appDetails.category).toBe("HEALTH_AND_FITNESS");
  });

  it("should verify Android build.gradle has matching namespace and versionCode", () => {
    const gradlePath = path.resolve(process.cwd(), "android", "app", "build.gradle");
    expect(fs.existsSync(gradlePath)).toBe(true);
    const gradleContent = fs.readFileSync(gradlePath, "utf-8");
    expect(gradleContent).toContain('applicationId "com.strkyr.app"');
    expect(gradleContent).toContain("versionCode 100");
    expect(gradleContent).toContain('versionName "1.0.0"');
    expect(gradleContent).toContain("signingConfigs");
  });
});
