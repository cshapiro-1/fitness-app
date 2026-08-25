---
name: auto-heal-deployments
description: >-
  Autonomous CI/CD and deployment self-healing system. Uses GitHub MCP tools and Actions APIs to inspect build failure logs, diagnose compile/test errors, apply fixes, and re-verify builds.
---

# Autonomous CI/CD & Deployment Self-Healing Runbook

Use this skill whenever a deployment fails, a GitHub Actions build breaks, or when running autonomous goals (`/goal`) to verify production deployments.

## 1. Diagnostics & Failure Log Extraction
1. Use GitHub MCP tools or `gh run view --log-failed` / `curl` on GitHub Actions API to extract the exact compiler error and failed line.
2. Locate the failed step (e.g. TypeScript type check `npx tsc --noEmit`, test suite `npm run test`, or Turbopack build `npx next build`).

## 2. Local Reproduction & Fix
1. Reproduce the failure locally:
   ```bash
   npx prisma generate
   npx tsc --noEmit
   npm run test
   ```
2. Apply the targeted fix to the offending source file.
3. Validate locally with `npm run ci:check`.

## 3. Atomic Commit & Push
1. Commit the hotfix with a descriptive message:
   ```bash
   git add -A
   git commit -m "fix(ci): <brief description of fix>"
   git push origin main:main
   git push origin main:master
   ```
2. Trigger production deploy:
   ```bash
   vercel --prod --yes
   ```
3. Monitor the new deployment until green.
