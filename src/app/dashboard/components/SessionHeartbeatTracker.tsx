"use client";

import { useEffect, useRef } from "react";

const SESSION_STORAGE_KEY = "strkyr_active_session_id";
const LAST_ACTIVE_KEY = "strkyr_last_active_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

export function SessionHeartbeatTracker() {
  const sessionStartRef = useRef<number>(Date.now());
  const hasInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    sessionStartRef.current = Date.now();

    // Check if this is a new browser/app visit session
    let isNewSession = false;
    let currentSessionId = "";

    try {
      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);
      const now = Date.now();
      const lastActiveTime = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;
      const isExpired = !lastActiveTime || now - lastActiveTime > SESSION_TIMEOUT_MS;

      if (!storedSessionId || isExpired) {
        // Start a new session
        isNewSession = true;
        currentSessionId = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(SESSION_STORAGE_KEY, currentSessionId);
      } else {
        currentSessionId = storedSessionId;
      }
      localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
    } catch {
      currentSessionId = `sess_${Date.now()}`;
    }

    const sendHeartbeat = (isStarting: boolean = false) => {
      const now = Date.now();
      const elapsedSeconds = Math.max(1, Math.floor((now - sessionStartRef.current) / 1000));
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        fetch("/api/user/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            durationSeconds: elapsedSeconds,
            isNewSession: isStarting && isNewSession,
            sessionId: currentSessionId,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // Initial heartbeat after 3 seconds of active engagement
    const initialTimer = setTimeout(() => {
      hasInitializedRef.current = true;
      sendHeartbeat(true);
    }, 3000);

    // Periodic heartbeat every 45 seconds while active
    const interval = setInterval(() => sendHeartbeat(false), 45000);

    const handleVisibilityOrUnload = () => {
      sendHeartbeat(false);
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
      sendHeartbeat(false);
    };
  }, []);

  return null;
}
