import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;

      if (token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId },
          include: {
            clients: { select: { id: true }, take: 1 },
            clientProfile: { select: { id: true } },
          },
        });

        if (dbUser) {
          let role = dbUser.role;
          let clientProfileId = dbUser.clientProfileId;

          // Automatically link a new account as a client login when email matches an existing client record.
          if (dbUser.role === "TRAINER" && dbUser.clients.length === 0 && !dbUser.clientProfileId) {
            const matchingClient = await prisma.client.findFirst({
              where: { email: dbUser.email, loginUser: null },
              select: { id: true },
            });

            if (matchingClient) {
              const updated = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  role: "CLIENT",
                  clientProfileId: matchingClient.id,
                },
                select: {
                  role: true,
                  clientProfileId: true,
                },
              });

              role = updated.role;
              clientProfileId = updated.clientProfileId;
            }
          }

          token.role = role;
          token.clientProfileId = clientProfileId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = (token.role as "TRAINER" | "CLIENT") ?? "TRAINER";
        session.user.clientProfileId = token.clientProfileId ?? null;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
};
