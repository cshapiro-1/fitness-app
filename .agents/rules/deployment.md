---
description: Rule for automated deployment verification, polling, and autonomous self-healing
globs: "**/*"
---

# Automated Deployment & Polling Policy

1. **Standard Deployment Command**:
   - When deploying to production, execute `npm run ship:prod` (or `node scripts/deploy-and-watch.mjs`).
   - This script automatically triggers `vercel --prod --yes` and polls the Vercel deployment status every 15 seconds until `READY` (Success) or `ERROR` (Failure).

2. **Autonomous Error Recovery Loop**:
   - If `deploy-and-watch` exits with an error or Vercel logs a build failure:
     1. Analyze the compiler/test error line from the log output.
     2. Apply the targeted code fix immediately.
     3. Verify locally with `npm run ci:check`.
     4. Commit and re-execute `npm run ship:prod` until the production deployment succeeds and `https://www.strkyr.fit/api/health/ping` returns 200 OK.
