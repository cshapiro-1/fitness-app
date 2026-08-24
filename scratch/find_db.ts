import dotenv from "dotenv";
import fs from "fs";

// Let's check environment files
const files = [".env.development.local", ".env.production.live", ".env.local", ".env.production"];
for (const f of files) {
  if (fs.existsSync(f)) {
    const parsed = dotenv.config({ path: f }).parsed || {};
    console.log(`File: ${f}, keys:`, Object.keys(parsed));
    if (parsed.DATABASE_URL) {
      console.log(`  DATABASE_URL in ${f}:`, parsed.DATABASE_URL.substring(0, 20) + "..." + parsed.DATABASE_URL.substring(parsed.DATABASE_URL.length - 15));
    }
  }
}
