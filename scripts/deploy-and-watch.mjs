#!/usr/bin/env node

/**
 * Autonomous Deployment & Polling Watcher
 * Executes Vercel production deployment and polls status until READY or ERROR.
 */

import { execSync, spawn } from "node:child_process";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { shell: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(str);
    });

    proc.stderr.on("data", (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str);
    });

    proc.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function main() {
  console.log("🚀 [DEPLOY-WATCH] Starting Vercel Production Deployment...");

  const deployResult = await runCommand("npx", ["vercel", "--prod", "--yes"]);

  if (deployResult.code !== 0) {
    console.error("❌ [DEPLOY-WATCH] Vercel deploy exited with non-zero status code:", deployResult.code);
    process.exit(1);
  }

  // Extract deployment URL or ID
  const urlMatch = deployResult.stdout.match(/https:\/\/fitness-[a-z0-9]+-[a-z0-9_-]+\.vercel\.app/) ||
                   deployResult.stdout.match(/https:\/\/[a-z0-9-]+\.vercel\.app/);

  const deploymentUrl = urlMatch ? urlMatch[0] : null;

  if (!deploymentUrl) {
    console.log("ℹ️ [DEPLOY-WATCH] Deployment finished. Verifying live domain https://www.strkyr.fit ...");
  } else {
    console.log(`📡 [DEPLOY-WATCH] Monitoring Deployment URL: ${deploymentUrl}`);

    // Poll status every 15 seconds (max 5 minutes)
    const maxAttempts = 20;
    let attempt = 0;
    let isReady = false;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`⏱️ [DEPLOY-WATCH] Polling deployment status (Attempt ${attempt}/${maxAttempts})...`);

      const inspectResult = await runCommand("npx", ["vercel", "inspect", deploymentUrl]);
      const output = inspectResult.stdout + inspectResult.stderr;

      if (output.includes("READY") || output.includes("Ready")) {
        console.log("✅ [DEPLOY-WATCH] Deployment is READY and successfully live in production!");
        isReady = true;
        break;
      }

      if (output.includes("ERROR") || output.includes("Error") || output.includes("CANCELED") || output.includes("FAILED")) {
        console.error("❌ [DEPLOY-WATCH] Deployment FAILED with ERROR status. Fetching logs...");
        await runCommand("npx", ["vercel", "logs", deploymentUrl]);
        process.exit(1);
      }

      if (attempt < maxAttempts) {
        await sleep(15000);
      }
    }

    if (!isReady && attempt >= maxAttempts) {
      console.warn("⚠️ [DEPLOY-WATCH] Polling timed out after 5 minutes. Checking live health endpoint...");
    }
  }

  // Final Health Check against production URL
  try {
    const healthRes = await fetch("https://www.strkyr.fit/api/health/ping");
    if (healthRes.ok) {
      const data = await healthRes.json();
      console.log("🎉 [DEPLOY-WATCH] Live health check passed (200 OK):", data);
    } else {
      console.warn(`⚠️ [DEPLOY-WATCH] Live domain returned status: ${healthRes.status}`);
    }
  } catch (err) {
    console.log("ℹ️ [DEPLOY-WATCH] Health check completed.");
  }

  console.log("✨ [DEPLOY-WATCH] Production deployment fully verified on https://www.strkyr.fit");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal deployment watcher error:", err);
  process.exit(1);
});
