"use client";
import { SessionProvider } from "next-auth/react";
import { SessionHeartbeatTracker } from "./dashboard/components/SessionHeartbeatTracker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionHeartbeatTracker />
      {children}
    </SessionProvider>
  );
}
