export interface AppEnv {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  GOOGLE_PLAY_PACKAGE_NAME?: string;
}

export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

export const env: AppEnv = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  GOOGLE_PLAY_PACKAGE_NAME: process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.fitnesscoach.app",
};
