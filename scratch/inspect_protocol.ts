import dotenv from "dotenv";
const parsed = dotenv.config({ path: ".env.production.live" }).parsed || {};
const dbUrl = parsed.DATABASE_URL || "";
console.log("Protocol:", dbUrl.split(":")[0]);
console.log("Full length:", dbUrl.length);
if (dbUrl.includes("@")) {
  const parts = dbUrl.split("@");
  console.log("Host part:", parts[1]);
} else {
  console.log("No @ symbol. Value starts with:", dbUrl.substring(0, 10));
}
