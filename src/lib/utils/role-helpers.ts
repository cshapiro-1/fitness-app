import { UserRole } from "@prisma/client";

/**
 * Safely normalizes input role strings to valid UserRole enums (TRAINER / CLIENT).
 * Converts lowercase "trainer" -> UserRole.TRAINER to prevent P2007 driver adapter errors.
 */
export function normalizeUserRole(inputRole?: string | null): UserRole {
  if (!inputRole) return UserRole.CLIENT;
  const normalized = inputRole.trim().toUpperCase();
  if (normalized === "TRAINER") return UserRole.TRAINER;
  if (normalized === "CLIENT" || normalized === "USER") return UserRole.CLIENT;
  return (UserRole as Record<string, UserRole>)[normalized] || UserRole.CLIENT;
}