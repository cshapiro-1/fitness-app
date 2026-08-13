import { UserRole } from "@prisma/client";

export type AppUserRole = UserRole | "TRAINER" | "CLIENT";

export function parseRole(role?: string | null): UserRole {
  if (!role) return UserRole.TRAINER;
  const upper = String(role).trim().toUpperCase();
  if (upper === "CLIENT") return UserRole.CLIENT;
  return UserRole.TRAINER;
}

export const normalizeRole = parseRole;
