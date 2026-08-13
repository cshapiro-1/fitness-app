import "next-auth";

type AppUserRole = "TRAINER" | "CLIENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      clientProfileId?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AppUserRole;
    clientProfileId?: string | null;
  }
}
