"use client";

import { useEffect, useRef } from "react";

export function SessionHeartbeatTracker() {
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    sessionStartRef.current = Date.now();

    const sendHeartbeat = () => {
      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - sessionStartRef.current) / 1000));
      try {
        fetch("/api/user/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationSeconds: elapsedSeconds }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // Initial heartbeat after 5 seconds of active engagement
    const initialTimer = setTimeout(sendHeartbeat, 5000);

    // Periodic heartbeat every 45 seconds while active
    const interval = setInterval(sendHeartbeat, 45000);

    const handleVisibilityOrUnload = () => {
      sendHeartbeat();
    };

    window.addEventListener("visibilitychange", handleVisibilityOrUnload);
    window.addEventListener("beforeunload", handleVisibilityOrUnload);
    window.addEventListener("pagehide", handleVisibilityOrUnload);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityOrUnload);
      window.removeEventListener("beforeunload", handleVisibilityOrUnload);
      window.removeEventListener("pagehide", handleVisibilityOrUnload);
      sendHeartbeat();
    };
  }, []);

  return null;
}
